import { Module } from '@nestjs/common';
import { ReviewEventService } from './review-event.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReviewEventService],
  exports: [ReviewEventService],
})
export class ReviewModule {}
