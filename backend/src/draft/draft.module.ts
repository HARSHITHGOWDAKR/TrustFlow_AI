import { Module } from '@nestjs/common';
import { DraftWorker } from './draft.worker';
import { LlmAgentsModule } from '../llm-agents/llm-agents.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [LlmAgentsModule, PrismaModule],
  providers: [DraftWorker],
  exports: [DraftWorker],
})
export class DraftModule {}
