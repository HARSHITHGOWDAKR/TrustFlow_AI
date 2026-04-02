import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmAgentsModule } from './llm-agents/llm-agents.module';
import { TrustFlowKnowledgeModule } from './trustflow-knowledge/trustflow-knowledge.module';
import { DraftModule } from './draft/draft.module';
import { ProjectsModule } from './projects/projects.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewModule } from './review/review.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';

@Module({
  imports: [
    PrismaModule,
    LlmAgentsModule,
    TrustFlowKnowledgeModule,
    DraftModule,
    ProjectsModule,
    ReviewModule,
    KnowledgeBaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
