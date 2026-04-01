import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewEventService {
  private readonly logger = new Logger(ReviewEventService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logReviewEvent(
    questionItemId: number,
    action: 'approve' | 'reject' | 'edit',
    oldAnswer: string | null,
    newAnswer: string | null,
    reviewer: string,
  ) {
    try {
      const event = await this.prisma.reviewEvent.create({
        data: {
          questionItemId,
          action,
          oldAnswer,
          newAnswer,
          reviewer,
        },
      });

      this.logger.log(`Review event logged: ${action} for question ${questionItemId}`);
      return event;
    } catch (error) {
      this.logger.error(`Failed to log review event`, error as Error);
      throw error;
    }
  }

  async getReviewEvents(questionItemId: number) {
    return this.prisma.reviewEvent.findMany({
      where: { questionItemId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getProjectReviewTrail(projectId: number) {
    return this.prisma.reviewEvent.findMany({
      where: {
        questionItem: {
          projectId,
        },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        questionItem: true,
      },
    });
  }
}
