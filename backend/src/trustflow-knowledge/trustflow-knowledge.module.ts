import { Module } from '@nestjs/common';
import { TrustFlowKnowledgeService } from './trustflow-knowledge.service';
import { TrustFlowKnowledgeController } from './trustflow-knowledge.controller';
import { AwsIntegrationModule } from '../aws-integration/aws-integration.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AwsIntegrationModule, PrismaModule],
  providers: [TrustFlowKnowledgeService],
  controllers: [TrustFlowKnowledgeController],
  exports: [TrustFlowKnowledgeService],
})
export class TrustFlowKnowledgeModule {}
