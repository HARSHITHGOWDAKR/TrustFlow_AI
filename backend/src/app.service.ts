import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'TrustFlow Backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
      routes: [
        'GET /projects',
        'POST /projects/upload',
        'GET /projects/:id/review',
        'GET /projects/:id/review-queue',
        'PATCH /projects/questions/:id/status',
        'GET /projects/:id/export',
        'POST /knowledge-base/:projectId/ingest',
      ],
    };
  }
}
