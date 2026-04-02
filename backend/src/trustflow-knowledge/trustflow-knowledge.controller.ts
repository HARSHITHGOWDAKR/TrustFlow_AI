import { Controller, Post, UploadedFile, UseInterceptors, Param, HttpException, HttpStatus, Get, Logger, BadRequestException, Patch, Delete, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { TrustFlowKnowledgeService } from './trustflow-knowledge.service';
import { PrismaService } from '../prisma/prisma.service';
import { DraftWorker } from '../draft/draft.worker';

@Controller('knowledge-base')
export class TrustFlowKnowledgeController {
  private readonly logger = new Logger(TrustFlowKnowledgeController.name);

  constructor(
    private readonly trustFlowKnowledgeService: TrustFlowKnowledgeService,
    private readonly prisma: PrismaService,
    private readonly draftWorker: DraftWorker,
  ) {}

  @Post(':projectId/ingest')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 52428800 }, // 50MB limit
  }))
  async ingestFile(@Param('projectId') projectId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      this.logger.error('No file uploaded - file parameter is null/undefined');
      throw new BadRequestException('No file uploaded. Please provide a .txt file.');
    }

    this.logger.log(`✅ File received: ${file.originalname} (${file.size} bytes, type: ${file.mimetype})`);

    // Accept text/plain, text/*, and application/octet-stream (for .txt files)
    const validMimeTypes = [
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/octet-stream',
      'application/x-txt',
    ];

    const isValidFile = validMimeTypes.includes(file.mimetype) || 
                       file.mimetype.startsWith('text/') ||
                       file.originalname.endsWith('.txt');

    if (!isValidFile) {
      throw new HttpException(
        `Invalid file type: ${file.mimetype}. Only text files (.txt) are supported.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const numericProjectId = Number(projectId);
      
      this.logger.debug(`Processing file: ${file.originalname} (${file.size} bytes)`);
      this.logger.debug(`Buffer size: ${file.buffer.length}`);
      
      const result = await this.trustFlowKnowledgeService.ingestTextFileToKnowledgeBase(
        numericProjectId,
        file.buffer,
        file.originalname,
      );

      this.logger.log(`✅ Successfully ingested file: ${result.chunkCount} chunks`);

      await this.prisma.questionItem.updateMany({
        where: {
          projectId: numericProjectId,
          status: {
            in: ['PENDING', 'DRAFTED', 'NEEDS_REVIEW'],
          },
        },
        data: {
          status: 'PENDING',
          answer: null,
          confidence: null,
          citations: null,
        },
      });

      await this.draftWorker.enqueueDraft(numericProjectId);

      return {
        success: true,
        message: `Successfully ingested ${result.chunkCount} chunks and queued draft generation`,
        ...result,
      };
    } catch (error) {
      const message = (error as Error).message || 'Knowledge base ingestion failed';
      
      this.logger.error(`❌ Ingestion error: ${message}`, error);

      if (message.includes('Project not found')) {
        throw new HttpException(message, HttpStatus.NOT_FOUND);
      }

      if (message.includes('SubscriptionRequiredException') || message.includes('AWS Access Key Id needs a subscription')) {
        throw new HttpException(
          'Textract is not enabled for this AWS account/key. Enable Textract access in AWS or use credentials with Textract subscription.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (message.includes('Invalid Gemini API key') || message.includes('Embedding model unavailable')) {
        throw new HttpException(
          message,
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (message.includes('No valid text chunks') || message.includes('No text content')) {
        throw new HttpException(
          message,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        `File ingestion failed: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':projectId/stats')
  async getKnowledgeStats(@Param('projectId') projectId: string) {
    try {
      return await this.trustFlowKnowledgeService.getKnowledgeStats(Number(projectId));
    } catch (error) {
      const message = (error as Error).message || 'Failed to load knowledge stats';
      if (message.includes('Project not found')) {
        throw new HttpException(message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':projectId/chunks')
  async getProjectChunks(@Param('projectId') projectId: string) {
    try {
      const numericProjectId = Number(projectId);
      
      // Get all chunks from database
      const chunks = await this.prisma.knowledgeChunk.findMany({
        where: { projectId: numericProjectId },
        orderBy: [
          { source: 'asc' },
          { chunkIndex: 'asc' },
        ],
      });

      this.logger.log(`📦 Retrieved ${chunks.length} chunks for project ${numericProjectId}`);

      return {
        projectId: numericProjectId,
        totalChunks: chunks.length,
        sources: Array.from(new Set(chunks.map(c => c.source))),
        chunks: chunks.map(c => ({
          id: c.id,
          source: c.source,
          chunkIndex: c.chunkIndex,
          chunk: c.chunk,
          pineconeId: c.pineconeId,
          createdAt: c.createdAt,
        })),
      };
    } catch (error) {
      const message = (error as Error).message || 'Failed to load chunks';
      this.logger.error(`❌ Error loading chunks: ${message}`, error);
      throw new HttpException(`Failed to load chunks: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':projectId/chunks/:chunkId')
  async updateChunk(
    @Param('projectId') projectId: string,
    @Param('chunkId') chunkId: string,
    @Body() data: { chunk: string },
  ) {
    try {
      const numericProjectId = Number(projectId);
      const numericChunkId = Number(chunkId);

      if (!data.chunk || data.chunk.trim().length === 0) {
        throw new BadRequestException('Chunk content cannot be empty');
      }

      const updatedChunk = await this.prisma.knowledgeChunk.update({
        where: { id: numericChunkId },
        data: {
          chunk: data.chunk,
        },
      });

      this.logger.log(`✏️ Updated chunk ${numericChunkId} for project ${numericProjectId}`);

      return {
        success: true,
        message: 'Chunk updated successfully',
        chunk: updatedChunk,
      };
    } catch (error) {
      const message = (error as Error).message || 'Failed to update chunk';
      this.logger.error(`❌ Error updating chunk: ${message}`, error);

      if (message.includes('not found') || message.includes('No record')) {
        throw new HttpException('Chunk not found', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(`Failed to update chunk: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':projectId/chunks/:chunkId')
  async deleteChunk(
    @Param('projectId') projectId: string,
    @Param('chunkId') chunkId: string,
  ) {
    try {
      const numericProjectId = Number(projectId);
      const numericChunkId = Number(chunkId);

      const chunk = await this.prisma.knowledgeChunk.findUnique({
        where: { id: numericChunkId },
      });

      if (!chunk) {
        throw new HttpException('Chunk not found', HttpStatus.NOT_FOUND);
      }

      if (chunk.projectId !== numericProjectId) {
        throw new HttpException('Chunk does not belong to this project', HttpStatus.FORBIDDEN);
      }

      await this.prisma.knowledgeChunk.delete({
        where: { id: numericChunkId },
      });

      this.logger.log(`🗑️ Deleted chunk ${numericChunkId} from project ${numericProjectId}`);

      return {
        success: true,
        message: 'Chunk deleted successfully',
        deletedId: numericChunkId,
      };
    } catch (error) {
      const message = (error as Error).message || 'Failed to delete chunk';
      this.logger.error(`❌ Error deleting chunk: ${message}`, error);

      if (message.includes('not found') || message.includes('No record')) {
        throw new HttpException('Chunk not found', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(`Failed to delete chunk: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':projectId/chunks/summary')
  async getChunksSummary(@Param('projectId') projectId: string) {
    try {
      const numericProjectId = Number(projectId);
      
      // Get chunk statistics
      const chunks = await this.prisma.knowledgeChunk.findMany({
        where: { projectId: numericProjectId },
      });

      const bySource = chunks.reduce((acc, chunk) => {
        if (!acc[chunk.source]) {
          acc[chunk.source] = [];
        }
        acc[chunk.source].push(chunk);
        return acc;
      }, {} as Record<string, typeof chunks>);

      const summary = Object.entries(bySource).map(([source, sourceChunks]) => ({
        source,
        chunkCount: sourceChunks.length,
        totalCharacters: sourceChunks.reduce((sum, c: typeof chunks[0]) => sum + c.chunk.length, 0),
        chunksPreview: sourceChunks.slice(0, 3).map((c: typeof chunks[0]) => ({
          index: c.chunkIndex,
          preview: c.chunk.substring(0, 100) + (c.chunk.length > 100 ? '...' : ''),
          length: c.chunk.length,
        })),
      }));

      return {
        projectId: numericProjectId,
        totalChunks: chunks.length,
        totalFiles: Object.keys(bySource).length,
        totalCharacters: chunks.reduce((sum, c) => sum + c.chunk.length, 0),
        bySource: summary,
      };
    } catch (error) {
      const message = (error as Error).message || 'Failed to load summary';
      this.logger.error(`❌ Error loading summary: ${message}`, error);
      throw new HttpException(`Failed to load summary: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
