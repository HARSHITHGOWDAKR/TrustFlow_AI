import { Controller, Post, Get, Patch, Param, Body, UploadedFile, UseInterceptors, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { TrustFlowKnowledgeService } from '../trustflow-knowledge/trustflow-knowledge.service';
import { DraftWorker } from '../draft/draft.worker';
import * as XLSX from 'xlsx';
import type { Response } from 'express';

interface CitationItem {
  embeddingId: number;
  score: number;
  snippet: string;
  source: string;
}

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeService: TrustFlowKnowledgeService,
    private readonly draftWorker: DraftWorker,
  ) {}

  private parseCitations(rawCitations: string | null): CitationItem[] {
    if (!rawCitations) return [];
    try {
      const parsed = JSON.parse(rawCitations) as CitationItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  @Get()
  async listProjects() {
    const projects = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadQuestions(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][];

    if (!rows || rows.length <= 1) {
      throw new HttpException('No questions found in uploaded file', HttpStatus.BAD_REQUEST);
    }

    const project = await this.prisma.project.create({
      data: { name: `Project ${new Date().toISOString()}` },
    });

    const questionItems = [];

    // assume first row header has question column
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const question = String(row[0] ?? '').trim();
      if (!question) continue;

      const item = await this.prisma.questionItem.create({
        data: {
          projectId: project.id,
          question,
          status: 'PENDING',
        },
      });
      questionItems.push(item);
    }

    // Immediately enqueue draft worker so questions start processing
    // even without a knowledge base (will show "Not enough information")
    await this.draftWorker.enqueueDraft(project.id);

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      questionsCount: questionItems.length,
      draftQueued: true,
      message: 'Questions uploaded and queued for processing. They will appear in the review section shortly.',
    };
  }

  @Get(':id/review')
  async getReviewData(@Param('id') id: string) {
    const projectId = Number(id);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { questions: true },
    });

    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }

    // Fetch audit trail for all questions
    const auditTrails = await this.prisma.reviewEvent.findMany({
      where: { questionItem: { projectId } },
      orderBy: { timestamp: 'asc' },
    });

    // Group audit trails by questionItemId
    const auditMap = new Map<number, typeof auditTrails>();
    auditTrails.forEach((event) => {
      const key = event.questionItemId;
      if (!auditMap.has(key)) {
        auditMap.set(key, []);
      }
      auditMap.get(key)!.push(event);
    });

    return {
      projectId: project.id,
      questions: project.questions.map((q) => {
        let frontendStatus = q.status;
        if (q.status === 'NEEDS_REVIEW') {
          frontendStatus = 'NEEDS_EDIT';
        } else if (q.status === 'REJECTED') {
          frontendStatus = 'FLAGGED';
        }

        return {
          id: q.id,
          question: q.question,
          answer: q.answer,
          status: frontendStatus,
          confidence: q.confidence,
          citations: this.parseCitations(q.citations),
          auditTrail: (auditMap.get(q.id) || []).map((event) => ({
            id: event.id,
            action: event.action.toUpperCase(),
            reviewer: event.reviewer,
            timestamp: event.timestamp.toISOString(),
            previousValue: event.oldAnswer,
            newValue: event.newAnswer,
          })),
        };
      }),
    };
  }

  @Get(':id/review-queue')
  async getReviewQueue(@Param('id') id: string) {
    const projectId = Number(id);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }

    const questions = await this.prisma.questionItem.findMany({
      where: { projectId, status: { in: ['PENDING', 'NEEDS_REVIEW', 'REJECTED'] } },
      orderBy: { id: 'asc' },
    });

    return {
      projectId,
      questions: questions.map((q) => {
        // Map database statuses back to frontend format
        let frontendStatus = q.status;
        if (q.status === 'NEEDS_REVIEW') {
          frontendStatus = 'NEEDS_EDIT';
        } else if (q.status === 'REJECTED') {
          frontendStatus = 'FLAGGED';
        }

        return {
          id: q.id,
          question: q.question,
          answer: q.answer,
          status: frontendStatus,
          confidence: q.confidence,
          citations: this.parseCitations(q.citations),
        };
      }),
    };
  }

  @Patch('questions/:id/status')
  async updateQuestionStatus(
    @Param('id') id: string,
    @Body() body: { status: string; editedAnswer?: string; reviewer?: string },
  ) {
    const questionId = Number(id);
    const { status, editedAnswer, reviewer } = body;

    // Validate status - accept frontend statuses (APPROVED, NEEDS_EDIT, FLAGGED, PENDING, PROCESSING)
    const validStatuses = ['PENDING', 'DRAFTED', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_EDIT', 'FLAGGED', 'PROCESSING'];
    if (!validStatuses.includes(status)) {
      throw new HttpException(`Invalid status. Accepted: ${validStatuses.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    // Get current question to track review event
    const currentQuestion = await this.prisma.questionItem.findUnique({
      where: { id: questionId },
    });

    if (!currentQuestion) {
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }

    // Map frontend statuses to backend if needed
    let dbStatus = status;
    if (status === 'NEEDS_EDIT') {
      dbStatus = 'NEEDS_REVIEW';
    } else if (status === 'FLAGGED') {
      dbStatus = 'REJECTED';
    }

    // Update question
    const updated = await this.prisma.questionItem.update({
      where: { id: questionId },
      data: {
        status: dbStatus,
        answer: editedAnswer?.trim() || currentQuestion.answer,
      },
    });

    // Continuous learning loop: approved answers become new retrieval memory.
    if (dbStatus === 'APPROVED' && updated.answer?.trim()) {
      await this.knowledgeService.ingestFeedbackAnswer(
        currentQuestion.projectId,
        currentQuestion.question,
        updated.answer,
        reviewer ?? 'reviewer',
      );
    }

    // Log review event - map frontend statuses to actions
    let action = 'edit';
    if (status === 'APPROVED') {
      action = 'approve';
    } else if (status === 'FLAGGED' || status === 'REJECTED') {
      action = 'reject';
    } else if (status === 'NEEDS_EDIT' || status === 'NEEDS_REVIEW') {
      action = 'needs_edit';
    }

    await this.prisma.reviewEvent.create({
      data: {
        questionItemId: questionId,
        action,
        oldAnswer: currentQuestion.answer,
        newAnswer: updated.answer,
        reviewer: reviewer ?? 'user',
      },
    });

    // Return with original frontend status
    return { ...updated, status };
  }

  /**
   * MANUAL TRIGGER: Re-enqueue pending questions for processing
   * Used when the DraftWorker queue was cleared or for manual retry
   */
  @Post(':id/trigger-processing')
  async triggerProcessing(@Param('id') id: string) {
    const projectId = Number(id);
    
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    
    // Count pending questions (case-insensitive check for both 'PENDING' and 'pending')
    const pendingQuestions = await this.prisma.questionItem.findMany({
      where: { projectId },
    });
    
    const pending = pendingQuestions.filter(q => 
      q.status.toUpperCase() === 'PENDING' || q.status.toUpperCase() === 'DRAFTED'
    );
    
    const pendingCount = pending.length;
    
    if (pendingCount === 0) {
      return {
        message: 'No pending questions to process',
        pendingCount: 0,
        status: 'idle',
      };
    }
    
    // Re-enqueue for processing
    await this.draftWorker.enqueueDraft(projectId);
    
    return {
      message: `Re-enqueued ${pendingCount} questions for processing`,
      pendingCount,
      status: 'queued',
    };
  }

  @Get(':id/export')
  async exportProject(@Param('id') id: string, @Res() res: Response) {
    const projectId = Number(id);
    
    // Check if any items are still in NEEDS_REVIEW
    const pendingCount = await this.prisma.questionItem.count({
      where: { projectId, status: 'NEEDS_REVIEW' },
    });

    if (pendingCount > 0) {
      throw new HttpException(
        'There are items needing review. Cannot export until all items are reviewed.',
        HttpStatus.CONFLICT,
      );
    }

    const questions = await this.prisma.questionItem.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
    });

    const worksheetData = [
      ['Question', 'Final Answer', 'Status', 'Confidence'],
      ...questions.map((q) => [q.question, q.answer || '', q.status, q.confidence || 0]),
    ];

    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, ws, 'Export');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="project-${projectId}-export.xlsx"`);
    res.send(buffer);
  }
}

