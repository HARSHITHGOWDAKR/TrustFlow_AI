# TrustFlow - AI-Powered Question & Answer System

TrustFlow is an intelligent question-answering system that combines RAG (Retrieval-Augmented Generation), LLM agents, and knowledge base management to provide accurate, confident, and traceable answers with citations.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## Project Overview

TrustFlow is a full-stack application with:
- **Backend**: NestJS-based REST API with RAG, LLM agents, and knowledge base management
- **Frontend**: React-based UI for project management, question review, and knowledge base uploads
- **Database**: PostgreSQL with Prisma ORM and vector embeddings support
- **LLM Integration**: Multi-provider support (Gemini, HuggingFace, Pinecone)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v13.0 or higher
- **Git**: Latest version

### Required API Keys
- **Google Gemini API** (for LLM capabilities)
- **Pinecone API** (for vector embeddings)
- **HuggingFace API** (optional, for alternative LLM provider)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/HARSHITHGOWDAKR/TrustFlow_AI.git
cd TrustFlow_AI
```

### 2. Install Dependencies

#### Backend Setup
```bash
cd backend
npm install
```

#### Frontend Setup
```bash
cd ../frontend
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/trustflow"

# LLM Providers
GEMINI_API_KEY="your-gemini-api-key"
HUGGINGFACE_API_KEY="your-huggingface-api-key"
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX="your-index-name"
PINECONE_ENVIRONMENT="your-environment"

# Server
PORT=3000
NODE_ENV=development

# JWT (if applicable)
JWT_SECRET="your-secret-key"
```

### 4. Set Up Database

#### Create PostgreSQL Database
```bash
createdb trustflow
```

#### Run Prisma Migrations
```bash
cd backend
npx prisma migrate dev --name init
```

#### Enable Vector Extension (for embeddings)
```bash
# Connect to PostgreSQL
psql -U postgres -d trustflow

# Run SQL
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 5. Seed the Database (Optional)

```bash
cd backend
npx prisma db seed
```

## Configuration

### Backend Configuration

The backend uses environment variables for configuration. Key settings:

- **Database**: PostgreSQL connection string
- **LLM Providers**: API keys for Gemini, HuggingFace, and Pinecone
- **Port**: Default 3000 (configurable via PORT env var)
- **Vector Database**: Pinecone credentials for embeddings

### Frontend Configuration

The frontend connects to the backend API at:
- Development: `http://localhost:3000`
- Production: Configure via environment variables

## Running the Project

### Development Mode

#### Start Backend
```bash
cd backend
npm run start:dev
```

The backend will run on `http://localhost:3000`

#### Start Frontend (in another terminal)
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173` (Vite default)

### Production Mode

#### Build Backend
```bash
cd backend
npm run build
npm run start:prod
```

#### Build Frontend
```bash
cd frontend
npm run build
npm run preview
```

### Using Docker (Optional)

If Docker is configured:

```bash
docker-compose up -d
```

## Project Structure

```
TrustFlow/
├── backend/                          # NestJS Backend
│   ├── src/
│   │   ├── llm-agents/              # LLM agent services
│   │   ├── knowledge-base/          # Knowledge base management
│   │   ├── projects/                # Project management
│   │   ├── trustflow-knowledge/     # RAG system
│   │   └── main.ts                  # Entry point
│   ├── prisma/
│   │   └── schema.prisma            # Database schema
│   └── package.json
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   ├── pages/                   # Page components
│   │   └── App.tsx
│   ├── index.html
│   └── package.json
│
├── packages/
│   └── types/                       # Shared TypeScript types
│
├── prisma/
│   └── schema.prisma                # Database schema
│
└── README.md                        # This file
```

## Key Features

### 1. Project Management
- Create and manage projects
- Upload questions in bulk
- Track question status (PENDING, DRAFTED, NEEDS_REVIEW, APPROVED, REJECTED)

### 2. RAG System
- Retrieve relevant context from knowledge base
- Generate answers using context and LLM
- Provide confidence scores
- Include citations from source documents

### 3. Knowledge Base
- Upload PDF documents and markdown files
- Automatic chunking and embedding generation
- Vector search for relevant documents
- Full-text search support

### 4. LLM Agent Integration
- Multi-provider support (Gemini, HuggingFace, etc.)
- Automatic fallback mechanism
- Configurable model parameters
- Response parsing and validation

### 5. Review Interface
- Interactive review workflow
- Edit answers inline
- Approve or reject with feedback
- Export final answers

## API Endpoints

### Projects
- `POST /projects` - Create project
- `GET /projects` - List projects
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project

### Questions
- `POST /projects/:id/questions` - Add questions
- `GET /projects/:id/questions` - Get project questions
- `PUT /projects/:id/questions/:qid` - Update question status

### Knowledge Base
- `POST /knowledge-base/upload` - Upload document
- `GET /knowledge-base/search` - Search knowledge base
- `DELETE /knowledge-base/:id` - Delete document

### RAG
- `POST /rag/generate-answer` - Generate answer for question
- `GET /rag/retrieve` - Retrieve context documents

### Export
- `GET /projects/:id/export` - Export project answers

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Ensure PostgreSQL is running: `psql --version`
- Check DATABASE_URL in .env file
- Verify PostgreSQL service is active

#### 2. Missing API Keys
```
Error: GEMINI_API_KEY is not defined
```

**Solution:**
- Set all required API keys in .env file
- Restart backend server

#### 3. Vector Extension Not Found
```
Error: type "vector" does not exist
```

**Solution:**
```bash
psql -U postgres -d trustflow
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

#### 4. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# Change PORT in .env or use different port
PORT=3001 npm run start:dev
```

#### 5. CORS Issues
```
Error: Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
- Ensure backend is running
- Check CORS configuration in backend
- Frontend URL should be whitelisted

### Getting Help

For issues and support:
1. Check the documentation files in the project root
2. Review backend logs: `backend/db-output.txt`
3. Check browser console for frontend errors
4. Review server console output

## Development Scripts

### Backend
```bash
npm run start:dev      # Start with hot reload
npm run build          # Build for production
npm run start:prod     # Run production build
npm run test           # Run tests
npm run lint           # Run linter
```

### Frontend
```bash
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run linter
npm run test           # Run tests
```

## Environment Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Node.js v18+ installed
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] .env file created with API keys
- [ ] Database migrations applied
- [ ] Vector extension enabled
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can create projects
- [ ] Can upload questions
- [ ] Can generate answers

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Pinecone Documentation](https://docs.pinecone.io/)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support, email support@trustflow.ai or open an issue on GitHub.

---

**Happy Coding! 🚀**
