# TrustFlow AI Backend

A **NestJS** backend for the TrustFlow AI agent, integrating **AWS Bedrock** and **Amazon Textract** for intelligent document processing and RAG-based Q&A workflows.

## Architecture Overview

- **AWS Integration**: Textract for document parsing, Bedrock for embeddings & LLM calls
- **Vector Database**: PostgreSQL with pgvector for semantic search
- **Background Jobs**: BullMQ workers for asynchronous draft generation
- **RAG Pipeline**: LangChain-based text chunking with semantic search
- **Human-in-the-Loop**: Confidence thresholds determine review requirements

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- AWS Account with Bedrock & Textract access
- AWS credentials configured locally

## Project Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Edit `.env` with your AWS credentials:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trustflow
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
PORT=3000
```

### 3. Start Docker Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 16 with pgvector extension
- Redis 7 for BullMQ

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

## Development

### Run Development Server

```bash
npm run start:dev
```

Server runs on `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Projects
- `POST /projects/upload` - Upload questionnaire (.xlsx)
- `GET /projects/:id/review` - Get review data
- `PATCH /projects/questions/:id/status` - Update question status
- `GET /projects/:id/export` - Export to Excel (409 if pending)

### Knowledge Base
- `POST /knowledge-base/:projectId/ingest` - Ingest PDF to knowledge base

## Database Schema

### Models
- **Project** - Main project container
- **QuestionItem** - Questions with AI-generated answers
- **Embedding** - Vector embeddings for semantic search (1536-dim Titan embeddings)

### Key Features
- Vector similarity search using pgvector
- Confidence scoring (0.65 threshold for human review)
- Citation tracking from source PDFs

## Services

### AwsIntegrationService
- `parseDocumentWithTextract()` - Extract text & tables from PDFs
- `generateEmbeddings()` - Create 1536-dim Bedrock Titan embeddings
- `generateDraftAnswer()` - Generate answers using Claude 3.5 Sonnet

### TrustFlowKnowledgeService
- `ingestPdfToKnowledgeBase()` - RAG pipeline for PDF ingestion
- Text chunking (1000 chars, 200 overlap)
- Batch embedding generation

### DraftWorker
- Processes PENDING questions via BullMQ
- Vector similarity search (top 4 chunks)
- Confidence-based status assignment
- Citation aggregation

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Technical Highlights

✅ **Bedrock Titan Embeddings** - 1536-dimensional vectors for precise semantic search  
✅ **Amazon Textract** - Handles complex tables in SOC 2 PDFs  
✅ **Human-in-the-Loop** - 0.65 confidence threshold gates review workflows  
✅ **BullMQ Workers** - Scalable background job processing  
✅ **pgvector** - Native PostgreSQL vector similarity search  

## Troubleshooting

### PostgreSQL Connection Failed
- Ensure Docker containers are running: `docker ps`
- Check DATABASE_URL in .env

### Bedrock/Textract Errors
- Verify AWS credentials in .env
- Ensure AWS region supports Bedrock models
- Check service quotas in AWS console

### Redis Connection Issues
- Verify Redis container is healthy: `docker-compose ps`
- Check REDIS_HOST and REDIS_PORT in .env

## License

UNLICENSED
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
