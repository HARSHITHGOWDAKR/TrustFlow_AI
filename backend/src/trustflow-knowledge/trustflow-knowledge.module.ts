import { Module } from '@nestjs/common';
import { TrustFlowKnowledgeService } from './trustflow-knowledge.service';
import { TrustFlowKnowledgeController } from './trustflow-knowledge.controller';
import { LlmAgentsModule } from '../llm-agents/llm-agents.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DraftModule } from '../draft/draft.module';
import { RAGService } from './rag.service';
import { RAGController } from './rag.controller';

@Module({
  imports: [LlmAgentsModule, PrismaModule, DraftModule],
  providers: [TrustFlowKnowledgeService, RAGService],
  controllers: [TrustFlowKnowledgeController, RAGController],
  exports: [TrustFlowKnowledgeService, RAGService],
})
export class TrustFlowKnowledgeModule {}
