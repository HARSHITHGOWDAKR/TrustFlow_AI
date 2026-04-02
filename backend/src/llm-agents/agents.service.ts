import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { PineconeService, PineconeMatch } from './pinecone.service';
import { HuggingfaceService } from './huggingface.service';

export interface AgentResult {
  question: string;
  category: string;
  expandedQuery: string;
  retrievedChunks: Array<{
    source: string;
    chunk: string;
    score: number;
  }>;
  answer: string;
  verificationStatus: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  verificationReason: string;
  verificationSuggestions: string;
  confidence: number;
  sources: Array<{ source: string; chunk: string; score: number }>;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private geminiService: GeminiService,
    private pineconeService: PineconeService,
    private huggingfaceService: HuggingfaceService,
  ) {}

  /**
   * FULL PIPELINE: Execute all 4 agents in sequence
   */
  async processQuestion(
    question: string,
    projectId: number,
  ): Promise<AgentResult> {
    try {
      this.logger.log(`Processing question: ${question}`);

      // STEP 1: INTAKE AGENT - Classify and expand query
      this.logger.debug('STEP 1: Running Intake Agent...');
      const intake = await this.geminiService.intakeQuestion(question);
      this.logger.debug(`Intake result: category=${intake.category}, expanded=${intake.expandedQuery}`);

      // STEP 2: EMBEDDING - Generate embedding for expanded query
      this.logger.debug('STEP 2: Generating embeddings...');
      const queryEmbedding = await this.geminiService.embedText(intake.expandedQuery);

      // STEP 3: RETRIEVAL AGENT - Query Pinecone with expanded query
      this.logger.debug('STEP 3: Running Retrieval Agent (Pinecone)...');
      const retrievedMatches = await this.pineconeService.retrieveChunks(
        queryEmbedding,
        6, // top-K
        projectId,
      );

      const retrievedChunks = this.formatChunksForContext(retrievedMatches);
      this.logger.debug(`Retrieved ${retrievedChunks.length} chunks`);

      // STEP 4: DRAFTER AGENT - Generate answer using context
      this.logger.debug('STEP 4: Running Drafter Agent (Mistral/HuggingFace)...');
      const answer = await this.huggingfaceService.generateAnswer(
        question,
        retrievedChunks,
      );
      this.logger.debug(`Generated answer: ${answer.substring(0, 100)}...`);

      // STEP 5: CRITIC AGENT - Verify and score answer
      this.logger.debug('STEP 5: Running Critic Agent (Gemini)...');
      const chunkTexts = retrievedChunks.map(
        (c) => `${c.source}: ${c.chunk.substring(0, 200)}...`
      );
      const verification = await this.geminiService.criticAnswer(
        question,
        answer,
        chunkTexts,
      );
      this.logger.debug(`Verification: status=${verification.status}, confidence=${verification.confidence}`);

      return {
        question,
        category: intake.category,
        expandedQuery: intake.expandedQuery,
        retrievedChunks,
        answer,
        verificationStatus: verification.status,
        verificationReason: verification.reasoning,
        verificationSuggestions: verification.suggestions,
        confidence: verification.confidence,
        sources: retrievedChunks,
      };
    } catch (error) {
      this.logger.error('Question processing pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Helper: Format Pinecone matches for context display
   */
  private formatChunksForContext(
    matches: PineconeMatch[]
  ): Array<{ source: string; chunk: string; score: number }> {
    return matches.map((m) => ({
      source: m.metadata.source,
      chunk: m.metadata.chunk,
      score: m.score,
    }));
  }
}
