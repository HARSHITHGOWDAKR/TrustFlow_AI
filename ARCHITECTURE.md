# TrustFlow AI

> AI-powered RAG agent for automating security questionnaires and RFPs, powered by **AWS Bedrock** and **Amazon Textract**

Inspired by [Q-Flow](https://github.com/degerahmet/q-flow), TrustFlow ingests security policy PDFs, generates intelligent answers with human-in-the-loop review, and exports final results.

## Key Features

✅ **AWS-Native Architecture** - Bedrock for LLM, Textract for document extraction  
✅ **RAG with Citations** - Vector search over knowledge base with source tracking  
✅ **Confidence Scoring** - Low-confidence answers flagged for mandatory review  
✅ **Human-in-the-Loop** - Review interface with approve/edit/reject workflow  
✅ **Audit Trail** - ReviewEvent logs track all review actions  
✅ **Continuous Learning** - Approved/edited answers are embedded back into memory  
✅ **Export Gate** - 409 response if items still need review  

## What It Does

1. **Knowledge Base Ingestion**: Upload security policy PDFs (SOC2, ISO27001, etc.)
2. **PDF Processing**: Extract text/tables using Amazon Textract
3. **Embeddings**: Convert chunks to 1024-dim vectors using Bedrock Titan v2
4. **Question Upload**: Create project from Excel questionnaire
5. **Draft Generation**: AI generates answers using RAG + Claude 3.5 Sonnet
6. **Human Review**: Approve, edit, or reject each answer
7. **Export**: Download finalized Q&A as Excel (after all reviewed)

## Architecture

```
TrustFlow/
├── apps/
│   ├── backend/          # NestJS + NestJS
│   │   ├── src/
│   │   │   ├── aws-integration/      # Bedrock & Textract
│   │   │   ├── trustflow-knowledge/  # RAG pipeline
│   │   │   ├── draft/                # BullMQ workers
│   │   │   ├── projects/             # Project CRUD
│   │   │   └── review/               # Review events
│   │   └── prisma/
│   └── frontend/         # React + Vite + Tailwind
│       └── src/pages/
│           ├── Projects.tsx          # Upload & workflow
│           └── KnowledgeBase.tsx     # PDF ingestion
├── packages/
│   └── types/           # Shared DTOs (Q-Flow pattern)
└── docker-compose.yml
```

## Database Schema (Prisma)

```prisma
model Project {
  id          Int
  name        String
  description String?
  questions   QuestionItem[]
  embeddings  Embedding[]
}

model QuestionItem {
  id           Int
  projectId    Int
  question     String
  answer       String?
  status       String  // PENDING → DRAFTED → NEEDS_REVIEW → APPROVED/REJECTED
  confidence   Float?  // Vector similarity score (0.65 threshold)
  citations    String? // Source chunks
  reviewEvents ReviewEvent[]
}

model Embedding {
  id        Int
  projectId Int
  chunk     String
  vector    vector(1024)  // Bedrock Titan v2 embeddings
  source    String?       // PDF filename
}

model ReviewEvent {
  id              Int
  questionItemId  Int
  action          String  // approve, reject, edit
  oldAnswer       String?
  newAnswer       String?
  reviewer        String?
  timestamp       DateTime
}
```

## API Endpoints

### Projects
- `POST /projects/upload` - Upload Excel questionnaire
- `GET /projects/:id/review` - Get review data
- `PATCH /projects/questions/:id/status` - Update Q status (with optional edit)
- `GET /projects/:id/export` - Export to Excel (409 if NEEDS_REVIEW items exist)

### Knowledge Base
- `POST /knowledge-base/:projectId/ingest` - Ingest PDF to KB

## Status Flow (Q-Flow Pattern)

```
PENDING (uploaded)
   ↓
   [DraftWorker processes with vector search]
   ↓
DRAFTED (confidence ≥ 0.65) or NEEDS_REVIEW (confidence < 0.65)
   ↓
   [Human reviews in ReviewInterface]
   ↓
APPROVED or REJECTED
   ↓
   [Can export once all reviewed]
```

## Confidence Scoring

- **Vector Similarity**: Top matching chunks from knowledge base
- **Threshold**: 0.65
- **Below 0.65**: Status = `NEEDS_REVIEW`
- **Above 0.65**: Status = `DRAFTED` (ready to approve/edit)

## Service Stack

### Backend
- **NestJS** - REST API framework
- **AWS SDK v3**
  - `@aws-sdk/client-bedrock-runtime` - LLM + embeddings
  - `@aws-sdk/client-textract` - PDF extraction
- **Prisma** - Type-safe ORM
- **pgvector** - PostgreSQL vector extension
- **BullMQ** - Background job queue
- **Redis** - Job queue storage

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Infrastructure
- **PostgreSQL 16** + pgvector for vectors
- **Redis 7** for BullMQ
- **Docker Compose** for local dev

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop
- AWS Account (Bedrock + Textract access)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/trustflow.git
cd trustflow
npm install
```

### 2. Configure .env

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trustflow
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
PORT=3000
```

### 3. Start Services

```bash
# Terminal 1: Start infrastructure
cd backend
docker-compose up -d

# Wait 30 seconds for DB init
npx prisma migrate dev
npm run start:dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

### 4. End-to-End Workflow

1. **Knowledge Base** → Upload security policy PDF
2. **Projects** → Create project from Excel questionnaire
3. **Review** → Approve/edit AI-generated answers
4. **Export** → Download Excel with final Q&A

## Key Improvements Over Q-Flow

| Feature | Q-Flow | TrustFlow |
|---------|--------|-----------|
| **LLM** | Google Gemini | AWS Bedrock |
| **Document Input** | Markdown copy-paste | PDF (Textract) |
| **PDF Support** | ❌ | ✅ Tables, forms, layout |
| **Knowledge Input** | Manual Markdown| PDF drag-drop |
| **Embedings** | Gemini | Bedrock Titan (1024-dim) |
| **Architecture** | Monorepo (Turborepo) | Monorepo (npm workspaces) |

## AWS Integration Details

### Bedrock
- **Embeddings**: `amazon.titan-embed-text-v2:0` (1024 dimensions)
- **LLM**: `anthropic.claude-3-5-sonnet-20240620-v1:0`
- **Error Handling**: Throttling, retry logic

### Textract
- **Features**: TEXT, TABLES, FORMS extraction
- **Use Case**: Extract structured/unstructured content from PDFs

### Confidence Gate
- Vector similarity score (0 to 1)
- **Threshold**: 0.65
- **Below**: NEEDS_REVIEW (human review mandatory)
- **Above**: DRAFTED (human can approve/skip)

## Project Structure

```
TrustFlow/
├── backend/
│   ├── src/
│   │   ├── aws-integration/
│   │   │   ├── aws-integration.service.ts      # Bedrock + Textract
│   │   │   └── aws-integration.module.ts
│   │   ├── trustflow-knowledge/
│   │   │   ├── trustflow-knowledge.service.ts  # RAG pipeline
│   │   │   ├── trustflow-knowledge.controller.ts
│   │   │   └── trustflow-knowledge.module.ts
│   │   ├── draft/
│   │   │   ├── draft.worker.ts                 # BullMQ processor
│   │   │   └── draft.module.ts
│   │   ├── projects/
│   │   │   ├── projects.controller.ts          # Upload, review, export
│   │   │   ├── projects.module.ts
│   │   │   └── dto/
│   │   ├── review/
│   │   │   ├── review-event.service.ts         # Audit trail
│   │   │   └── review.module.ts
│   │   └── prisma/
│   ├── prisma/
│   │   ├── schema.prisma                       # Data model
│   │   └── migrations/
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Projects.tsx                    # Main workflow
│   │   │   └── KnowledgeBase.tsx               # PDF ingestion
│   │   ├── components/
│   │   │   ├── ReviewInterface.tsx             # Review UI (approve/edit/reject)
│   │   │   └── ui/                             # shadcn/ui components
│   │   └── App.tsx
│   └── vite.config.ts
├── packages/
│   └── types/
│       └── src/
│           └── index.ts                        # Shared DTOs
└── package.json (monorepo root)
```

## Development

### Add a Package

```bash
mkdir packages/my-package
cd packages/my-package
npm init -y
# Edit package.json, then run from root:
npm install
```

### Run Both Services

```bash
npm run dev
```

## Performance Considerations

- **Vector Similarity Search**: pgvector `<=>` operator is fast with proper indexing
- **Batch Embedding**: 1000-char chunks balanced for quality/performance
- **Overlap**: 200 chars overlap prevents context loss
- **BullMQ**: Scalable worker pattern for draft generation

## Security

- **Closed Context**: Answers only from knowledge base (no general web search)
- **Review Gate**: Export blocked until human review complete
- **Third-Party Data**: AWS Bedrock for LLM inference (review your data policies)
- **JWT Ready**: Controller can accept user context for reviewer attribution

## Future Enhancements

- [ ] Answer memory reuse for similar questions
- [ ] Multi-tenant support
- [ ] Answer quality evaluation metrics
- [ ] Retry logic for failed jobs
- [ ] Admin dashboard for metrics

## License

MIT

## Credits

- Inspired by [Q-Flow](https://github.com/degerahmet/q-flow)
- Built with [NestJS](https://nestjs.com), [React](https://react.dev), [Prisma](https://prisma.io)
- AWS services: Bedrock, Textract, PostgreSQL
