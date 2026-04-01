# 🗄️ Database Complete Verification Report

## ✅ Database Connection Status

### **Configuration Confirmed**
```
✅ Provider: PostgreSQL
✅ Host: localhost
✅ Port: 5432
✅ Database: trustflow
✅ User: postgres
✅ Password: ••••••••
✅ Status: CONFIGURED AND ACTIVE
```

**Configuration File**: [backend/.env](backend/.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trustflow
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_REGION=us-east-1
```

---

## 🏗️ Complete Database Schema

### **Table 1: PROJECT** 📁
**Purpose**: Stores questionnaire projects  
**Created by**: XLSX upload

```
Column        | Type              | Purpose
---|---|---
id            | INTEGER PRIMARY KEY | Unique ID (auto-increment)
name          | VARCHAR(255)      | Project name (auto-generated from timestamp)
description   | TEXT (nullable)   | Project description
createdAt     | TIMESTAMP         | When project was created
updatedAt     | TIMESTAMP         | When project was last modified
```

**Example Record**:
```
id: 1
name: "Project 2025-04-01T14:30:00Z"
description: NULL
createdAt: 2025-04-01 14:30:00
updatedAt: 2025-04-01 14:30:00
```

**Relationships**: 
- Has many: QuestionItem (1 → many)
- Has many: Embedding (1 → many)

---

### **Table 2: QUESTIONITEM** ❓
**Purpose**: Stores individual questions from XLSX  
**Updated by**: DraftWorker (adds AI answers)

```
Column        | Type              | Purpose
---|---|---
id            | INTEGER PRIMARY KEY | Unique ID (auto-increment)
projectId     | INTEGER FK        | References Project.id
question      | TEXT              | The question text
answer        | TEXT (nullable)   | AI-generated answer
status        | VARCHAR(50)       | Question status
confidence    | FLOAT (nullable)  | AI confidence 0.0-1.0
citations     | JSON (nullable)   | Sources from PDF
createdAt     | TIMESTAMP         | When created
updatedAt     | TIMESTAMP         | When modified
```

**Status Lifecycle**:
- `PENDING` → Just uploaded, no answer yet
- `NEEDS_REVIEW` → AI answer generated, waiting for user
- `APPROVED` → User approved the answer
- `REJECTED` → User rejected, needs re-review
- `ARCHIVED` → Final state

**Citations Format**:
```json
[
  {
    "embeddingId": 1,
    "score": 0.92,
    "snippet": "Relevant text from PDF...",
    "source": "upload"
  }
]
```

**Example Record**:
```
id: 1
projectId: 1
question: "What is machine learning?"
answer: "Machine learning is a subset..."
status: "NEEDS_REVIEW"
confidence: 0.95
citations: [{"embeddingId": 5, "score": 0.92, ...}]
createdAt: 2025-04-01 14:30:05
updatedAt: 2025-04-01 14:30:12
```

**Relationships**:
- Belongs to: Project (FK)
- Has many: ReviewEvent (1 → many)

---

### **Table 3: EMBEDDING** 🔢
**Purpose**: Vector storage for PDF chunks  
**Created by**: PDF upload + AWS Bedrock

```
Column        | Type              | Purpose
---|---|---
id            | INTEGER PRIMARY KEY | Unique ID
projectId     | INTEGER FK        | References Project.id
chunk         | TEXT              | The text chunk from PDF
vector        | vector(1536)      | AI embedding vector (pgvector)
source        | VARCHAR(255)      | Source type ('upload' or 'review-feedback')
createdAt     | TIMESTAMP         | When embedding created
```

**Vector Details**:
- Dimension: 1536 (AWS Bedrock Titan standard)
- Type: pgvector (PostgreSQL vector extension)
- Use: Semantic similarity search
- Index: IVFFlat (fast approximate search)

**Example Record**:
```
id: 1
projectId: 1
chunk: "Machine learning enables systems to learn..."
vector: [-0.05, 0.12, -0.08, ..., 0.19] (1536 values)
source: "upload"
createdAt: 2025-04-01 14:35:00
```

**Relationships**:
- Belongs to: Project (FK)
- No direct relation to QuestionItem
- Used for: Similarity search when answering questions

---

### **Table 4: REVIEWEVENT** ✏️
**Purpose**: Audit log of user actions  
**Created by**: User review interactions

```
Column          | Type              | Purpose
---|---|---
id              | INTEGER PRIMARY KEY | Unique ID
questionItemId  | INTEGER FK        | References QuestionItem.id
action          | VARCHAR(50)       | 'approve', 'reject', or 'edit'
oldAnswer       | TEXT (nullable)   | Previous answer (if edited)
newAnswer       | TEXT (nullable)   | New answer (if edited)
reviewer        | VARCHAR(255) null | Reviewer username (optional)
timestamp       | TIMESTAMP         | When action occurred
```

**Example Records**:
```
id: 1
questionItemId: 1
action: "approve"
oldAnswer: NULL
newAnswer: NULL
reviewer: "user@example.com"
timestamp: 2025-04-01 14:35:30

---

id: 2
questionItemId: 1
action: "edit"
oldAnswer: "Original answer..."
newAnswer: "Modified answer..."
reviewer: "user@example.com"
timestamp: 2025-04-01 14:36:00
```

**Relationships**:
- Belongs to: QuestionItem (FK)

---

## 📊 Database Relationships Diagram

```
┌─────────────┐
│   PROJECT   │
└──────┬──────┘
       │ (1 → many)
       ├─────────────────────┬──────────────────────┐
       │                     │                      │
       ↓                     ↓                      ↓
┌─────────────────┐  ┌──────────────┐  ┌───────────────┐
│   QUESTIONITEM  │  │  EMBEDDING   │  │ REVIEWEVENT* │
└────────┬────────┘  └──────────────┘  │ (for audit)   │
         │ (1 → many)                   └───────────────┘
         │
         ↓
   ┌──────────┐
   │ FK: id   │
   └──────────┘

* REVIEWEVENT tracks changes to QUESTIONITEM
```

---

## 🔄 Data Flow Through Tables

```
1️⃣ USER UPLOADS XLSX
   └─ Project created → PROJECT table
   └─ Questions added → QUESTIONITEM (status: PENDING)

2️⃣ USER UPLOADS PDF
   └─ PDF chunks + embeddings → EMBEDDING table
   └─ Vectors stored in pgvector format

3️⃣ DRAFTWORKER PROCESSES (Auto)
   └─ Finds similar embeddings via vector similarity
   └─ Generates answer via AWS Claude
   └─ QUESTIONITEM updated:
      - answer: filled
      - status: NEEDS_REVIEW
      - confidence: 0.95 (example)
      - citations: populated

4️⃣ USER REVIEWS
   └─ Clicks APPROVE/REJECT/EDIT
   └─ QUESTIONITEM updated: status = APPROVED
   └─ ReviewEvent added for audit trail

5️⃣ USER EXPORTS
   └─ SELECT questions + answers
   └─ Generate XLSX file
```

---

## 🔍 How to View Stored Data

### **Method 1: Node.js Verification Script**
```bash
cd backend
node verify-db.js
```

Shows:
- ✅ Connection status
- ✅ Record counts from all tables
- ✅ Latest projects
- ✅ Questions and answers
- ✅ Embedding statistics

### **Method 2: Direct SQL Queries**
```bash
# Connect
psql -h localhost -U postgres -d trustflow

# View all records
SELECT COUNT(*) FROM "Project";
SELECT COUNT(*) FROM "QuestionItem";
SELECT COUNT(*) FROM "Embedding";
SELECT COUNT(*) FROM "ReviewEvent";

# View specific data
SELECT * FROM "Project" ORDER BY id DESC LIMIT 5;
SELECT id, question, status, answer FROM "QuestionItem";
SELECT "projectId", COUNT(*) FROM "Embedding" GROUP BY "projectId";
```

### **Method 3: GUI Tools**
- **DBeaver**: Visual database explorer
- **pgAdmin**: Web-based PostgreSQL UI
- **VS Code**: SQL extension with inline preview

### **Method 4: Backend Prisma API**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all projects with questions
const projects = await prisma.project.findMany({
  include: { 
    questions: true,
    embeddings: true 
  }
});

console.log(projects);
```

---

## ✅ Database Verification Checklist

| Check | Status | How to Verify |
|-------|--------|---------------|
| PostgreSQL Running | ✅ | `pg_isready -h localhost -p 5432` |
| Database Exists | ✅ | `psql -l \| grep trustflow` |
| Tables Created | ✅ | `\dt` in psql |
| pgvector Extension | ✅ | Check: `SELECT * FROM pg_extension WHERE extname='vector'` |
| Prisma Connected | ✅ | Backend logs: "PrismaModule initialized" |
| Project Records | TBD* | `SELECT COUNT(*) FROM "Project"` |
| Question Records | TBD* | `SELECT COUNT(*) FROM "QuestionItem"` |
| Embeddings Stored | TBD* | `SELECT COUNT(*) FROM "Embedding"` |
| Review Audit Trail | TBD* | `SELECT COUNT(*) FROM "ReviewEvent"` |

*TBD = Depends on data being uploaded via frontend

---

##📈 Data Volume Expectations

### **After 1 Project Upload**:
- Projects: 1
- QuestionItems: 5-10 (depending on your XLSX)
- Embeddings: 0 (until PDF uploaded)
- ReviewEvents: 0

### **After 1 PDF Upload**:
- Embeddings: 50-200 (depending on PDF length)
- Store size: ~200KB - 1MB (vectors are numeric)

### **After AI Processing**:
- QuestionItems status: NEEDS_REVIEW
- QuestionItems with answers: 5-10
- QuestionItems with citations: 5-10
- ReviewEvents: 0

### **After User Review**:
- QuestionItems status: APPROVED/REJECTED
- ReviewEvents: 5-10 (one per action)

---

## 🎯 Example: Complete Data Lifecycle

**Example Project ID 1: "ML Questions"**

### Project Table:
```
id: 1
name: "Project 2025-04-01T14:30:00Z"
createdAt: 2025-04-01 14:30:00
```

### QuestionItem Table (6 rows):
```
1 | 1 | "What is ML?"           | "ML is..." | APPROVED   | 0.95 | [{...}]
2 | 1 | "Types of ML?"          | "Supervised..." | NEEDS_REVIEW | 0.92 | [{...}]
3 | 1 | "What is supervised?"   | NULL   | PENDING    | NULL | NULL
4 | 1 | "Classification vs Reg?"| "Classification..." | APPROVED | 0.91 | [{...}]
5 | 1 | "What is clustering?"   | "Clustering is..." | APPROVED | 0.88 | [{...}]
6 | 1 | "Use cases of ML?"      | NULL   | PENDING    | NULL | NULL
```

### Embedding Table (120 rows):
```
All embeddings for Project 1 (from uploaded PDF)
Each row has:
- chunk: Part of PDF text (100-600 chars)
- vector: 1536-dimensional float array
- source: "upload"
```

### ReviewEvent Table (3 rows):
```
1 | 1 | "approve" | NULL | NULL | user@email | 2025-04-01 14:35:00
2 | 4 | "approve" | NULL | NULL | user@email | 2025-04-01 14:35:15
3 | 4 | "edit"    | "..." | "New answer" | user@email | 2025-04-01 14:35:45
```

---

## 🚀 Next Steps

1. **Upload Test Data**:
   - Go to http://localhost:8080/projects
   - Upload test XLSX → Data appears in Project + QuestionItem tables

2. **Upload Knowledge Base**:
   - Go to http://localhost:8080/knowledge-base
   - Upload test PDF → Data appears in Embedding table

3. **Verify Processing**:
   - Wait 2 seconds
   - Check QuestionItem: status should be NEEDS_REVIEW, answer should be populated

4. **Review & Export**:
   - Approve answers
   - Check ReviewEvent table for audit trail
   - Export as XLSX

5. **Query Database**:
   - Run any SQL query above
   - Use GUI tools to browse visually
   - Monitor data changes in real-time

---

## 💡 Summary

| Aspect | Details |
|--------|---------|
| **Database** | PostgreSQL 12+ on localhost:5432 |
| **Name** | trustflow |
| **User** | postgres / postgres |
| **Tables** | 4 tables with relationships |
| **Vectors** | pgvector (1536 dimensions) |
| **Access** | psql, DBeaver, Node.js, Prisma |
| **Status** | ✅ Configured, Connected, Ready |
| **Data** | TBD (upload to populate) |

**Everything is properly configured and ready to store/retrieve data!** 🎉
