import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../llm-agents/gemini.service';
import { PineconeService } from '../llm-agents/pinecone.service';

@Injectable()
export class TrustFlowKnowledgeService {
  private readonly logger = new Logger(TrustFlowKnowledgeService.name);
  private readonly chunkSize = Number(process.env.KB_CHUNK_SIZE || 600);
  private readonly chunkOverlap = Number(process.env.KB_CHUNK_OVERLAP || 120);
  private readonly minChunkLength = Number(process.env.KB_MIN_CHUNK_LENGTH || 120);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly pineconeService: PineconeService,
  ) {}

  private normalizeText(rawText: string): string {
    return rawText.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim();
  }

  private chunkText(rawText: string): string[] {
    const normalizedText = this.normalizeText(rawText);
    if (!normalizedText) return [];

    const paragraphs = normalizedText
      .split(/\n\s*\n/g)
      .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    if (paragraphs.length === 0) return [];

    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (paragraph.length >= this.chunkSize) {
        if (currentChunk.trim().length >= this.minChunkLength) {
          chunks.push(currentChunk.trim());
        }

        const overlapSuffix = this.getOverlapSuffix(currentChunk);
        currentChunk = overlapSuffix + ' ' + paragraph;

        while (currentChunk.length >= this.chunkSize) {
          const newChunk = currentChunk.substring(0, this.chunkSize);
          if (newChunk.trim().length >= this.minChunkLength) {
            chunks.push(newChunk.trim());
          }

          const overlapUpdate = this.getOverlapSuffix(newChunk);
          currentChunk = overlapUpdate + ' ' + currentChunk.substring(this.chunkSize);
        }
      } else {
        currentChunk += ' ' + paragraph;

        if (currentChunk.length >= this.chunkSize) {
          if (currentChunk.trim().length >= this.minChunkLength) {
            chunks.push(currentChunk.trim());
          }

          const overlapSuffix = this.getOverlapSuffix(currentChunk);
          currentChunk = overlapSuffix;
        }
      }
    }

    if (currentChunk.trim().length >= this.minChunkLength) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private getOverlapSuffix(text: string): string {
    if (this.chunkOverlap <= 0 || text.length <= this.chunkOverlap) {
      return text;
    }
    return text.slice(text.length - this.chunkOverlap);
  }

  /**
   * Ingest text file to knowledge base
   * 1. Chunk the text
   * 2. Generate embeddings using Gemini
   * 3. Store in Pinecone
   * 4. Store chunk metadata in database
   */
  async ingestTextFileToKnowledgeBase(
    projectId: number,
    buffer: Buffer,
    source = 'upload',
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new Error('Project not found');
    }

    const text = buffer.toString('utf-8');
    if (!text?.trim()) {
      throw new Error('No text content in uploaded file');
    }

    this.logger.log(`📄 Ingesting "${source}"...`);

    const chunks = this.chunkText(text);
    if (chunks.length === 0) {
      throw new Error('No chunkable content found');
    }

    this.logger.log(`📦 Split into ${chunks.length} chunks`);
    this.logger.log(`🔗 Generating embeddings...`);
    
    const embeddings = await this.geminiService.embedBatch(chunks);

    this.logger.log(`📌 Uploading to Pinecone...`);
    const pineconeVectors = chunks.map((chunk, index) => ({
      id: `${projectId}-${source}-${index}-${Date.now()}`,
      embedding: embeddings[index],
      source,
      chunk,
      projectId,
      chunkIndex: index,
    }));

    await this.pineconeService.upsertChunks(pineconeVectors);

    // Store chunks in database for retrieval
    this.logger.log(`💾 Storing chunks in database...`);
    await this.prisma.knowledgeChunk.deleteMany({
      where: {
        projectId,
        source,
      },
    });

    const dbChunks = await this.prisma.knowledgeChunk.createMany({
      data: chunks.map((chunk, index) => ({
        projectId,
        source,
        chunkIndex: index,
        chunk,
        pineconeId: pineconeVectors[index].id,
      })),
    });

    this.logger.log(`✅ Ingestion complete: ${chunks.length} chunks stored (DB: ${dbChunks.count})`);

    return {
      projectId,
      source,
      chunkCount: chunks.length,
      embedded: embeddings.length,
      parser: 'gemini-embeddings + pinecone + postgresql',
      dbCount: dbChunks.count,
    };
  }

  /**
   * Ingest feedback answer to knowledge base
   */
  async ingestFeedbackAnswer(
    projectId: number,
    question: string,
    answer: string,
    reviewer = 'human-review',
  ) {
    const content = `Question: ${question}\nAnswer: ${answer}`;
    const source = `review-feedback:${reviewer}`;

    const embedding = await this.geminiService.embedText(content);
    const pineconeVectors = [{
      id: `${projectId}-${source}-${Date.now()}-${Math.random()}`,
      embedding,
      source,
      chunk: content,
      projectId,
    }];

    await this.pineconeService.upsertChunks(pineconeVectors);
    this.logger.log(`Feedback embedded for project ${projectId} by ${reviewer}`);
  }

  /**
   * Get knowledge base stats
   */
  async getKnowledgeStats(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new Error('Project not found');
    }

    return {
      projectId,
      status: 'Knowledge base stored in Pinecone',
      message: 'Use retrieval agent to query knowledge base',
    };
  }
}
