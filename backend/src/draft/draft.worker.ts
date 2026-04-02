import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, Queue } from 'bullmq';
import { AgentsService } from '../llm-agents/agents.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../llm-agents/gemini.service';
import { PineconeService } from '../llm-agents/pinecone.service';

interface CitationItem {
  source: string;
  score: number;
  snippet: string;
}

@Injectable()
export class DraftWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DraftWorker.name);
  private readonly queueName = 'draft-questions';
  private queue: Queue;
  private worker: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
    private readonly geminiService: GeminiService,
    private readonly pineconeService: PineconeService,
  ) {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
    };

    this.queue = new Queue(this.queueName, { connection });

    this.worker = new Worker(
      this.queueName,
      async (job) => {
        const { projectId } = job.data;
        return this.processDraftQuestions(projectId);
      },
      {
        connection,
        lockDuration: 60000, // 60 seconds - allow jobs to process without timing out
        lockRenewTime: 15000, // Renew lock every 15 seconds
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`✅ Draft job completed for project ${job.data.projectId}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`❌ Draft job failed for project ${job?.data?.projectId}`, err);
    });
  }

  async onModuleInit() {
    await this.queue.waitUntilReady();
    await this.worker.waitUntilReady();
    this.logger.log('🚀 DraftWorker initialized and ready');
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.queue.close();
  }

  async enqueueDraft(projectId: number, opts?: any) {
    return this.queue.add('process', { projectId }, opts ?? {});
  }

  public async processDraftQuestions(projectId: number) {
    // Query for questions with any case variation of PENDING or pending
    let pendingItems = await this.prisma.questionItem.findMany({
      where: { projectId, status: 'PENDING' },
    });
    
    // If no uppercase PENDING found, try lowercase pending
    if (pendingItems.length === 0) {
      pendingItems = await this.prisma.questionItem.findMany({
        where: { projectId, status: 'pending' },
      });
    }
    
    // If still no items, try all items and filter in code (for any other case variations)
    if (pendingItems.length === 0) {
      const allItems = await this.prisma.questionItem.findMany({
        where: { projectId },
      });
      pendingItems = allItems.filter(q => q.status.toUpperCase() === 'PENDING');
    }

    if (pendingItems.length === 0) {
      this.logger.log(`No pending questions for project ${projectId}`);
      return { processed: 0 };
    }

    this.logger.log(`📝 Processing ${pendingItems.length} pending questions for project ${projectId}...`);

    let processedCount = 0;
    for (const questionItem of pendingItems) {
      try {
        const startTime = Date.now();
        this.logger.debug(`[Q${questionItem.id}] Starting 4-agent pipeline for: "${questionItem.question.substring(0, 50)}..."`);

        // RUN THE 4-AGENT PIPELINE
        const result = await this.agentsService.processQuestion(
          questionItem.question,
          projectId,
        );

        const processingTime = Date.now() - startTime;
        this.logger.debug(`[Q${questionItem.id}] Pipeline complete in ${processingTime}ms - Status: ${result.verificationStatus}`);

        // FORMAT CITATIONS FOR STORAGE
        const citations: CitationItem[] = result.sources.map((source) => ({
          source: source.source,
          score: source.score,
          snippet: source.chunk,
        }));

        // DETERMINE FINAL STATUS
        const finalStatus =
          result.verificationStatus === 'PASS'
            ? 'DRAFTED'
            : result.verificationStatus === 'FAIL'
              ? 'NEEDS_REVIEW'
              : 'NEEDS_REVIEW';

        this.logger.debug(
          `[Q${questionItem.id}] Updating database - Status: ${finalStatus}, Confidence: ${(result.confidence * 100).toFixed(0)}%`,
        );

        // UPDATE QUESTION WITH ALL AGENT PIPELINE DATA
        await this.prisma.questionItem.update({
          where: { id: questionItem.id },
          data: {
            answer: result.answer,
            citations: JSON.stringify(citations),
            confidence: result.confidence,
            status: finalStatus,
            // Agent pipeline data
            intakeCategory: result.category,
            expandedQuery: result.expandedQuery,
            retrievedChunksData: JSON.stringify(result.retrievedChunks),
            verificationStatus: result.verificationStatus,
            verificationReason: result.verificationReason,
            verificationSuggestions: result.verificationSuggestions,
            processingTimeMs: processingTime,
          },
        });

        this.logger.log(
          `✅ Q${questionItem.id}: ${finalStatus} (confidence ${(result.confidence * 100).toFixed(0)}%, ${processingTime}ms)`,
        );

        processedCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : '';
        this.logger.error(`❌ Q${questionItem.id} processing failed: ${errorMsg}`, errorStack);

        // Mark as needing review on error
        await this.prisma.questionItem.update({
          where: { id: questionItem.id },
          data: {
            status: 'NEEDS_REVIEW',
            answer: 'Error during processing. Please review manually.',
            citations: JSON.stringify([]),
            confidence: 0,
            verificationStatus: 'FAIL',
            verificationReason: errorMsg,
          },
        });
      }
    }

    this.logger.log(`🎉 Processed ${processedCount}/${pendingItems.length} questions for project ${projectId}`);
    return { processed: processedCount };
  }
}
