# TrustFlow AI

TrustFlow AI is an AWS-powered, human-in-the-loop RAG system that automates security questionnaire workflows.

It helps teams ingest policy documents, draft answers with citations, route low-confidence responses for review, and export final outputs.

## What This Project Solves

Security and compliance teams spend significant time manually answering repetitive questionnaires (SOC 2, ISO 27001, CAIQ, and similar formats). TrustFlow AI automates most of that flow while keeping humans in control for sensitive or low-confidence responses.

## Core Features

- PDF knowledge ingestion using Amazon Textract
- Semantic retrieval over pgvector in PostgreSQL
- Draft answer generation with Amazon Bedrock models
- Confidence-based review gating (`NEEDS_REVIEW` when confidence is low)
- Reviewer actions: approve, edit+approve, reject
- Audit trail with review events
- Export gate blocking when unresolved review items remain
- Continuous learning loop by embedding approved/edited answers

## Architecture

- Backend: NestJS + Prisma + BullMQ
- Frontend: React + Vite + Tailwind + shadcn/ui
- Data layer: PostgreSQL (pgvector) + Redis
- AWS services: Textract + Bedrock Runtime

Monorepo layout:

- `backend/` API, workers, Prisma schema
- `frontend/` UI
- `packages/` shared workspace packages

## Prerequisites

- Node.js 18+
- npm 9+
- Docker Desktop running
- AWS account and credentials with Bedrock/Textract access

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trustflow
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
PORT=3000
```

## Quick Start

From repo root:

1. Install dependencies

```bash
npm install
```

2. Start infra (Postgres + Redis)

```bash
cd backend
docker-compose up -d
```

3. Ensure pgvector extension is available

```bash
docker exec trustflow-postgres psql -U postgres -d trustflow -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

4. Sync Prisma schema and generate client

```bash
cd backend
npx prisma db push
npx prisma generate
```

5. Start backend

```bash
cd backend
npm run start:dev
```

6. Start frontend (new terminal)

```bash
cd frontend
npm run dev
```

## Run URLs

- Backend health: `http://localhost:3000/`
- Frontend: Vite will pick first free port (`8080+` in current setup)

## Demo Script (Mentor Pitch)

Use this 90-second flow when presenting:

1. Open the frontend and show `Projects`.
2. Upload a questionnaire (`.xlsx`) and create a project.
3. Open `Knowledge Base`, select the project, and ingest a policy PDF.
4. Show the review queue with confidence and citations.
5. Approve one answer, edit+approve one answer, reject one answer.
6. Explain that approved/edited answers are re-embedded (continuous learning).
7. Attempt export and show that review gate blocks unresolved items.
8. Complete review and export the final Excel.

Elevator line:

"TrustFlow AI automates the repetitive 80% of security questionnaires using AWS Bedrock + Textract, while forcing human validation on low-confidence answers."

## Screenshots / GIFs

Add media under:

- `docs/screenshots/`
- `docs/gifs/`

Recommended assets:

- `docs/screenshots/projects-dashboard.png`
- `docs/screenshots/knowledge-base-upload.png`
- `docs/screenshots/review-queue.png`
- `docs/screenshots/citations-panel.png`
- `docs/screenshots/export-gate.png`
- `docs/gifs/end-to-end-flow.gif`

Reference block (enable after files are added):

```md
![Projects Dashboard](docs/screenshots/projects-dashboard.png)
![Knowledge Base Upload](docs/screenshots/knowledge-base-upload.png)
![Review Queue](docs/screenshots/review-queue.png)
![Citations Panel](docs/screenshots/citations-panel.png)
![Export Gate](docs/screenshots/export-gate.png)
![End-to-End Demo](docs/gifs/end-to-end-flow.gif)
```

## Main API Endpoints

### Projects

- `GET /projects`
- `POST /projects/upload`
- `GET /projects/:id/review`
- `GET /projects/:id/review-queue`
- `PATCH /projects/questions/:id/status`
- `GET /projects/:id/export`

### Knowledge Base

- `POST /knowledge-base/:projectId/ingest`

## Typical Workflow

1. Upload questionnaire (`/projects/upload`)
2. Upload PDF knowledge for a project (`/knowledge-base/:projectId/ingest`)
3. Let worker draft answers
4. Review queue (`/projects/:id/review-queue`)
5. Approve/edit/reject
6. Export only when review gate passes

## Troubleshooting

### Backend fails to start with `EADDRINUSE: 3000`

Another process already holds port 3000.

```powershell
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -ne $conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

### Ingest endpoint returns 500/502

If you see `SubscriptionRequiredException`, your AWS key/account does not currently have Textract subscription/access.

- Enable Textract in your AWS account
- Use credentials with Textract permission and service access

### Vector dimension mismatch (`expected 1536 dimensions, not 1024`)

This means DB vector column shape and embedding dimension are out of sync.

- Ensure your active Prisma schema dimension matches runtime model settings
- Re-sync schema:

```bash
cd backend
npx prisma db push
```

If your existing table was created with a different vector size, recreate the embedding table or run a manual migration to align dimensions.

### Prisma Windows DLL lock (`EPERM ... query_engine-windows.dll.node`)

Stop all running backend processes and rerun:

```bash
npx prisma generate
```

## Notes

- Root endpoint (`/`) returns service health JSON, not hello-world text.
- CORS allows localhost development origins.

## License

UNLICENSED
