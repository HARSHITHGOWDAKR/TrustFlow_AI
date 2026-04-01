# 🗄️ TrustFlow Database Complete Verification Guide

## ✅ Database Connection Status

### **Configuration**
```
DATABASE_URL = postgresql://postgres:postgres@localhost:5432/trustflow
Provider: PostgreSQL
Host: localhost:5432
Database: trustflow
User: postgres
Password: postgres
Status: ✅ CONFIGURED AND CONNECTED
```

### **Verification Commands**

Run this in backend to verify connection:
```bash
cd backend
npm run start:dev
# Backend should log: "Application is running on: http://[::1]:3000"
```

---

## 📊 Database Schema (4 Main Tables)

### **1. PROJECT** (Projects/Questionnaires)
```sql
CREATE TABLE "Project" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Stores uploaded questionnaire projects  
**Data Type**: ID, Name, Description, Timestamps

---

### **2. QUESTIONITEM** (Individual Questions)
```sql
CREATE TABLE "QuestionItem" (
  id SERIAL PRIMARY KEY,
  projectId INTEGER REFERENCES "Project"(id) ON DELETE CASCADE,
  question TEXT,
  answer TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, NEEDS_REVIEW, APPROVED, REJECTED
  confidence FLOAT,
  citations JSON,                       -- Stores sources/citations
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Stores individual questions from XLSX  
**Status Lifecycle**:
- `PENDING` → Question uploaded, waiting for PDF knowledge base
- `NEEDS_REVIEW` → AI-generated answer ready for review
- `APPROVED` → Answer accepted by user
- `REJECTED` → Answer rejected, needs re-review
- `ARCHIVED` → Question finalized

**Citations Format**:
```json
[
  {
    "embeddingId": 42,
    "score": 0.95,
    "snippet": "Text from PDF chunk...",
    "source": "upload"
  }
]
```

---

### **3. EMBEDDING** (Vector Storage)
```sql
CREATE TABLE "Embedding" (
  id SERIAL PRIMARY KEY,
  projectId INTEGER REFERENCES "Project"(id) ON DELETE CASCADE,
  chunk TEXT,                        -- Text from PDF
  vector vector(1536),              -- pgvector - 1536 dimensions
  source VARCHAR(255),              -- 'upload' or 'review-feedback'
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON "Embedding" USING ivfflat (vector vector_cosine_ops);
```
**Purpose**: Stores PDF content as vectors for semantic search  
**Vector Dimension**: 1536 (AWS Bedrock Titan standard)  
**Index Type**: IVFFlat for fast similarity search  
**Data Stored**: Each chunk of PDF becomes a vector embedding

---

### **4. REVIEWEVENT** (Audit Trail)
```sql
CREATE TABLE "ReviewEvent" (
  id SERIAL PRIMARY KEY,
  questionItemId INTEGER REFERENCES "QuestionItem"(id) ON DELETE CASCADE,
  action VARCHAR(50),               -- 'approve', 'reject', 'edit'
  oldAnswer TEXT,                   -- Previous answer
  newAnswer TEXT,                   -- Updated answer
  reviewer VARCHAR(255),            -- Reviewer name
  timestamp TIMESTAMP DEFAULT NOW()
);
```
**Purpose**: Audit log of all user review actions  
**Actions**: Approve, Reject, Edit  
**Use Case**: Track who changed what and when

---

## 🔍 How to Access Data

### **Option 1: Query via Backend (Node.js)**
```javascript
// Create verify-db.js in backend folder
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function queryData() {
  // Get all projects
  const projects = await prisma.project.findMany({
    include: { questions: true }
  });
  
  console.log(projects);
  
  // Get embeddings count
  const embeddingCount = await prisma.embedding.count();
  console.log(`Total embeddings: ${embeddingCount}`);
  
  await prisma.$disconnect();
}

queryData();
```

Run:
```bash
cd backend
node verify-db.js
```

---

### **Option 2: Direct PostgreSQL (SQL)**

#### **Connect with psql CLI**:
```bash
psql postgresql://postgres:postgres@localhost:5432/trustflow
```

#### **View All Projects**:
```sql
SELECT id, name, description, "createdAt", "updatedAt" 
FROM "Project";
```

#### **View All Questions**:
```sql
SELECT 
  id, 
  "projectId", 
  question, 
  status, 
  answer, 
  confidence,
  "createdAt"
FROM "QuestionItem"
ORDER BY "projectId", id;
```

#### **View All Questions with Project Names**:
```sql
SELECT 
  q.id,
  p.name as project_name,
  q.question,
  q.status,
  q.answer,
  q.confidence
FROM "QuestionItem" q
LEFT JOIN "Project" p ON q."projectId" = p.id
ORDER BY p.id, q.id;
```

#### **View Embeddings Count per Project**:
```sql
SELECT 
  "projectId",
  COUNT(*) as embedding_count,
  MIN("createdAt") as first_created,
  MAX("createdAt") as last_created
FROM "Embedding"
GROUP BY "projectId";
```

#### **View Review Audit Trail**:
```sql
SELECT 
  id,
  "questionItemId",
  action,
  reviewer,
  timestamp
FROM "ReviewEvent"
ORDER BY timestamp DESC;
```

#### **Check Database Size**:
```sql
SELECT 
  pg_size_pretty(pg_database_size('trustflow')) as database_size,
  (SELECT count(*) FROM "Project") as projects,
  (SELECT count(*) FROM "QuestionItem") as questions,
  (SELECT count(*) FROM "Embedding") as embeddings;
```

---

### **Option 3: GUI Tools**

#### **DBeaver (Free)**
1. Download: https://dbeaver.io/download/
2. Create connection:
   - Host: `localhost`
   - Port: `5432`
   - Database: `trustflow`
   - User: `postgres`
   - Password: `postgres`
3. Browse tables and data visually

#### **pgAdmin (Free Web UI)**
1. Access: http://localhost:5050 (if running)
2. Create server with same credentials
3. Navigate: trustflow → Schemas → public → Tables

---

## 📊 Data Flow & Where It's Stored

```
┌─────────────────────────────┐
│  Step 1: Upload XLSX        │
└────────────┬────────────────┘
             │
             ↓
    ✅ Stored in: "Project" table
    ✅ Also in: "QuestionItem" table (status: PENDING)
    
    Example SQL:
    SELECT * FROM "Project" WHERE name LIKE '%Project%';
    SELECT * FROM "QuestionItem" WHERE status = 'PENDING';
    
┌─────────────────────────────┐
│  Step 2: Upload PDF         │
└────────────┬────────────────┘
             │
             ↓
    ✅ Stored in: "Embedding" table
    - Chunks: chunk column (TEXT)
    - Vectors: vector column (pgvector 1536-dim)
    - Metadata: source, createdAt
    
    Example SQL:
    SELECT COUNT(*) FROM "Embedding" WHERE "projectId" = 1;
    
┌─────────────────────────────┐
│  Step 3: AI Generation      │
└────────────┬────────────────┘
             │
             ↓
    ✅ Updated in: "QuestionItem" table
    - Column: answer (AI-generated text)
    - Column: status = 'NEEDS_REVIEW'
    - Column: confidence (0-1 score)
    - Column: citations (JSON array)
    
    Example SQL:
    SELECT answer, confidence, citations 
    FROM "QuestionItem" 
    WHERE status = 'NEEDS_REVIEW';
    
┌─────────────────────────────┐
│  Step 4: User Review        │
└────────────┬────────────────┘
             │
             ↓
    ✅ Updated in: "QuestionItem" table
    - Column: status = 'APPROVED'/'REJECTED'
    
    ✅ New record in: "ReviewEvent" table
    - action: 'approve' / 'reject' / 'edit'
    - reviewer: user name
    - newAnswer: if edited
    
    Example SQL:
    SELECT * FROM "ReviewEvent" WHERE action = 'approve';
```

---

## 🔍 Real-Time Data Inspection

### **Monitor Changes Live**

```sql
-- Watch for new questions (every 5 seconds)
SELECT COUNT(*) as total_questions FROM "QuestionItem";

-- Watch for new embeddings
SELECT COUNT(*) as total_embeddings FROM "Embedding";

-- Watch for status changes (PENDING → NEEDS_REVIEW)
SELECT status, COUNT(*) FROM "QuestionItem" GROUP BY status;

-- Watch for review events
SELECT COUNT(*) as total_actions FROM "ReviewEvent";
```

---

## ✅ Database Health Checklist

| Check | Command | Expected Result |
|-------|---------|-----------------|
| **Connection** | `node verify-db.js` | ✅ Connects successfully |
| **Tables Exist** | `\dt` in psql | ✅ 4 tables shown |
| **pgvector** | `SELECT * FROM pg_extension WHERE extname='vector'` | ✅ Found |
| **Projects** | `SELECT COUNT(*) FROM "Project"` | ≥ 0 |
| **Questions** | `SELECT COUNT(*) FROM "QuestionItem"` | ≥ 0 |
| **Embeddings** | `SELECT COUNT(*) FROM "Embedding"` | ≥ 0 after PDF upload |
| **Auto-increment** | `SELECT MAX(id) FROM "Project"` | IDs increment properly |

---

## 🚀 Quick Data Verification Commands

### **Run All in psql**:
```sql
-- 1. Database size
SELECT pg_size_pretty(pg_database_size('trustflow'));

-- 2. Table row counts
SELECT 'Project' as table_name, COUNT(*) as rows FROM "Project"
UNION ALL
SELECT 'QuestionItem', COUNT(*) FROM "QuestionItem"
UNION ALL
SELECT 'Embedding', COUNT(*) FROM "Embedding"
UNION ALL
SELECT 'ReviewEvent', COUNT(*) FROM "ReviewEvent";

-- 3. Latest records
SELECT 'Projects', MAX("createdAt") FROM "Project"
UNION ALL
SELECT 'Questions', MAX("createdAt") FROM "QuestionItem"
UNION ALL
SELECT 'Embeddings', MAX("createdAt") FROM "Embedding";

-- 4. Status distribution
SELECT status, COUNT(*) FROM "QuestionItem" GROUP BY status;
```

---

## 📝 Summary

| Aspect | Details |
|--------|---------|
| **Database** | PostgreSQL on localhost:5432 |
| **Name** | trustflow |
| **User** | postgres |
| **Status** | ✅ Configured and connected |
| **Tables** | 4 (Project, QuestionItem, Embedding, ReviewEvent) |
| **Extensions** | pgvector for vector search |
| **Connections** | Node.js (Prisma) + Direct SQL |
| **Data Access** | psql CLI, DBeaver, pgAdmin, Node.js scripts |

---

## 🎯 To Verify Everything Works

1. **Upload test XLSX** → Check `"Project"` and `"QuestionItem"` tables
2. **Upload test PDF** → Check `"Embedding"` table (should have rows)
3. **Wait 2 seconds** → Check `"QuestionItem"` (status should change to NEEDS_REVIEW)
4. **Review an answer** → Check `"ReviewEvent"` table (new row added)

**Data stored? Yes! ✅**
**Accessible? Via Node.js, psql, GUI tools! ✅**
**Processing correctly? Check logs and review data! ✅**
