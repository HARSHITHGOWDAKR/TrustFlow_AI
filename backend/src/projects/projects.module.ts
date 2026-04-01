import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { DraftModule } from '../draft/draft.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TrustFlowKnowledgeModule } from '../trustflow-knowledge/trustflow-knowledge.module';

@Module({
  imports: [PrismaModule, DraftModule, TrustFlowKnowledgeModule],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
