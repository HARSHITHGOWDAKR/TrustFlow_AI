import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AwsIntegrationService } from '../aws-integration/aws-integration.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrustFlowKnowledgeService {
  private readonly logger = new Logger(TrustFlowKnowledgeService.name);

  constructor(
    private readonly awsIntegrationService: AwsIntegrationService,
    private readonly prisma: PrismaService,
  ) {}

  private toVectorLiteral(embedding: number[]) {
    return `[${embedding.join(',')}]`;
  }

  private async persistEmbedding(projectId: number, chunk: string, source: string) {
    const embedding = await this.awsIntegrationService.generateEmbeddings(chunk, 1024);
    const vectorExpression = `vector('${this.toVectorLiteral(embedding)}')`;

    await this.prisma.$executeRaw`
      INSERT INTO "Embedding" ("projectId", "chunk", "vector", "source", "createdAt")
      VALUES (${projectId}, ${chunk}, ${Prisma.raw(vectorExpression)}, ${source}, NOW())
    `;
  }

  async ingestPdfToKnowledgeBase(projectId: number, buffer: Buffer, source = 'upload') {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new Error('Project not found');
    }

    const parsed = await this.awsIntegrationService.parseDocumentWithTextract(buffer);
    const text = parsed.text;
    if (!text?.trim()) {
      throw new Error('No text found via Textract');
    }

    const chunks: string[] = [];
    const chunkSize = 1000;
    const overlap = 200;

    for (let start = 0; start < text.length; start += chunkSize - overlap) {
      const chunk = text.slice(start, Math.min(start + chunkSize, text.length));
      chunks.push(chunk);
      if (start + chunkSize >= text.length) break;
    }

    const results = [];

    for (const chunk of chunks) {
      await this.persistEmbedding(projectId, chunk, source);

      results.push({ chunk, source });
    }

    return {
      projectId,
      source,
      chunkCount: chunks.length,
      inserted: results.length,
    };
  }

  async ingestFeedbackAnswer(projectId: number, question: string, answer: string, reviewer = 'human-review') {
    const content = `Question: ${question}\nAnswer: ${answer}`;
    const source = `review-feedback:${reviewer}`;
    await this.persistEmbedding(projectId, content, source);

    this.logger.log(`Feedback embedded for project ${projectId} by ${reviewer}`);
  }
}
