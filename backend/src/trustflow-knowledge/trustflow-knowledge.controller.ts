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
      const message = (error as Error).message || 'Knowledge base ingestion failed';

      if (message.includes('Project not found')) {
        throw new HttpException(message, HttpStatus.NOT_FOUND);
      }

      if (message.includes('SubscriptionRequiredException') || message.includes('AWS Access Key Id needs a subscription')) {
        throw new HttpException(
          'Textract is not enabled for this AWS account/key. Enable Textract access in AWS or use credentials with Textract subscription.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
