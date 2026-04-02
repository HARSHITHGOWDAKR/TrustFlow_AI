import { Module } from '@nestjs/common';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmAgentsModule } from '../llm-agents/llm-agents.module';

@Module({
  imports: [PrismaModule, LlmAgentsModule],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
