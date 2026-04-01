import { Module } from '@nestjs/common';
import { DraftWorker } from './draft.worker';
import { AwsIntegrationModule } from '../aws-integration/aws-integration.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AwsIntegrationModule, PrismaModule],
  providers: [DraftWorker],
  exports: [DraftWorker],
})
export class DraftModule {}
