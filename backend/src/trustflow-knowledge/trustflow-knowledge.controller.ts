import { Controller, Post, UploadedFile, UseInterceptors, Param, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TrustFlowKnowledgeService } from './trustflow-knowledge.service';

@Controller('knowledge-base')
export class TrustFlowKnowledgeController {
  constructor(private readonly trustFlowKnowledgeService: TrustFlowKnowledgeService) {}

  @Post(':projectId/ingest')
  @UseInterceptors(FileInterceptor('file'))
  async ingestPdf(@Param('projectId') projectId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    if (!file.mimetype.includes('pdf')) {
      throw new HttpException('Only PDF files are supported', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.trustFlowKnowledgeService.ingestPdfToKnowledgeBase(Number(projectId), file.buffer, file.originalname);
      return {
        success: true,
        message: `Successfully ingested ${result.chunkCount} chunks`,
        ...result,
      };
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
