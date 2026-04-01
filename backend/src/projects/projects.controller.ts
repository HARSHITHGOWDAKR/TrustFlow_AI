import { Controller, Post, Get, Patch, Param, Body, UploadedFile, UseInterceptors, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { DraftWorker } from '../draft/draft.worker';
import { TrustFlowKnowledgeService } from '../trustflow-knowledge/trustflow-knowledge.service';
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
    private readonly draftWorker: DraftWorker,
    private readonly knowledgeService: TrustFlowKnowledgeService,
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

    // Enqueue draft job (Q-Flow pattern)
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

    return {
      projectId: project.id,
      questions: project.questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        status: q.status,
        confidence: q.confidence,
        citations: this.parseCitations(q.citations),
      })),
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
      where: { projectId, status: 'NEEDS_REVIEW' },
      orderBy: { id: 'asc' },
    });

    return {
      projectId,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        status: q.status,
        confidence: q.confidence,
        citations: this.parseCitations(q.citations),
      })),
    };
  }

  @Patch('questions/:id/status')
  async updateQuestionStatus(
    @Param('id') id: string,
    @Body() body: { status: string; editedAnswer?: string; reviewer?: string },
  ) {
    const questionId = Number(id);
    const { status, editedAnswer, reviewer } = body;

    // Validate status (Q-Flow pattern)
    const validStatuses = ['PENDING', 'DRAFTED', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new HttpException('Invalid status', HttpStatus.BAD_REQUEST);
    }

    // Get current question to track review event
    const currentQuestion = await this.prisma.questionItem.findUnique({
      where: { id: questionId },
    });

    if (!currentQuestion) {
      throw new HttpException('Question not found', HttpStatus.NOT_FOUND);
    }

    // Update question
    const updated = await this.prisma.questionItem.update({
      where: { id: questionId },
      data: {
        status,
        answer: editedAnswer?.trim() || currentQuestion.answer,
      },
    });

    // Continuous learning loop: approved answers become new retrieval memory.
    if (status === 'APPROVED' && updated.answer?.trim()) {
      await this.knowledgeService.ingestFeedbackAnswer(
        currentQuestion.projectId,
        currentQuestion.question,
        updated.answer,
        reviewer ?? 'reviewer',
      );
    }

    // Log review event (Q-Flow audit trail pattern)
    await this.prisma.reviewEvent.create({
      data: {
        questionItemId: questionId,
        action: status === 'APPROVED' ? 'approve' : status === 'REJECTED' ? 'reject' : 'edit',
        oldAnswer: currentQuestion.answer,
        newAnswer: updated.answer,
        reviewer: reviewer ?? 'user',
      },
    });

    return updated;
  }

  @Get(':id/export')
  async exportProject(@Param('id') id: string, @Res() res: Response) {
    const projectId = Number(id);
    
    // Check if any items are still in NEEDS_REVIEW (Q-Flow export gate pattern)
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

