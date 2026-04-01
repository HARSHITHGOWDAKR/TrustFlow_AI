# TrustFlow Backend

NestJS API and worker layer for TrustFlow AI.

## Responsibilities

- Questionnaire upload and review APIs
- Knowledge ingestion endpoint for PDF processing
- Draft worker pipeline (BullMQ)
- Prisma models and database access

## Run (from `backend/`)

```bash
npm install
npx prisma db push
npx prisma generate
npm run start:dev
```

## Infra dependencies

- PostgreSQL + pgvector
- Redis

Use `docker-compose.yml` in this folder to start dependencies.

## Key endpoints

- `GET /projects`
- `POST /projects/upload`
- `GET /projects/:id/review`
- `GET /projects/:id/review-queue`
- `PATCH /projects/questions/:id/status`
- `GET /projects/:id/export`
- `POST /knowledge-base/:projectId/ingest`

## Full docs

See the repository root README for complete setup, architecture, workflow, and troubleshooting.
