# 🔗 Quick Database Access Instructions

## ✅ Database Connection Details

```
Host: localhost
Port: 5432
Database: trustflow
User: postgres
Password: postgres
Full URL: postgresql://postgres:postgres@localhost:5432/trustflow
```

---

## 🚀 How to View Stored Data Right Now

### **Method 1: Using Node.js Script (Easiest)**

Run this command from backend:
```bash
cd backend
node verify-db.js
```

This script will:
- ✅ Verify connection
- ✅ Count all records
- ✅ List all projects
- ✅ List all questions
- ✅ Show embeddings statistics
- ✅ Display table schema

---

### **Method 2: Using psql (PostgreSQL CLI)**

**Windows Command:**
```powershell
psql -h localhost -U postgres -d trustflow
```

When prompted, enter password: `postgres`

**Then run these SQL commands:**

```sql
-- See total record counts
SELECT 'Projects' as table_name, COUNT(*) as count FROM "Project"
UNION ALL SELECT 'Questions', COUNT(*) FROM "QuestionItem"
UNION ALL SELECT 'Embeddings', COUNT(*) FROM "Embedding"
UNION ALL SELECT 'ReviewEvents', COUNT(*) FROM "ReviewEvent";

-- See all projects
SELECT id, name, "createdAt" FROM "Project" ORDER BY id DESC;

-- See all questions with answers
SELECT id, "projectId", question, status, answer, confidence FROM "QuestionItem";

-- See embeddings per project
SELECT "projectId", COUNT(*) as chunk_count FROM "Embedding" GROUP BY "projectId";

-- Exit
\q
```

---

### **Method 3: Using DBeaver GUI**

1. Download DBeaver Free: https://dbeaver.io/download/
2. Click "New Database Connection" → PostgreSQL
3. Fill in:
   - Server Host: `localhost`
   - Port: `5432`
   - Database: `trustflow`
   - Username: `postgres`
   - Password: `postgres`
4. Test Connection → Click "Browse database"
5. Navigate: trustflow → public → "Project" (double-click to see data)

**Visual data inspection!** 🎨

---

### **Method 4: Using Backend Node.js Directly**

Create `backend/check-data.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 DATABASE STATUS\n');
  
  // List all projects
  console.log('1. PROJECTS:');
  const projects = await prisma.project.findMany();
  console.log(JSON.stringify(projects, null, 2));
  
  // List all questions
  console.log('\n2. QUESTIONS:');
  const questions = await prisma.questionItem.findMany();
  console.log(JSON.stringify(questions, null, 2));
  
  // Count embeddings
  console.log('\n3. EMBEDDINGS:');
  const embCount = await prisma.embedding.count();
  console.log(`Total embeddings: ${embCount}`);
  
  // Embedding stats by project
  const stats = await prisma.$queryRaw`
    SELECT "projectId", COUNT(*) as count 
    FROM "Embedding" 
    GROUP BY "projectId"
  `;
  console.log('By project:', stats);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run:
```bash
node check-data.js
```

---

## 📍 Where Database Data is Stored

### **Physical Location**
```
PostgreSQL Data Directory: 
C:\Program Files\PostgreSQL\XX\data\base\
(or wherever PostgreSQL is installed)
```

### **Database Within PostgreSQL**
```
Server: localhost
Port: 5432
Database: trustflow
Tables: Project, QuestionItem, Embedding, ReviewEvent
```

### **File Access**
Database data is in binary PostgreSQL format. You CANNOT edit directly.  
Access ONLY through:
- psql CLI
- pgAdmin
- DBeaver
- Prisma/Node.js
- Custom SQL

---

## 🔄 Data Processing Flow & Storage

```
USER UPLOADS XLSX FILE
        ↓
Backend Parses XLSX
        ↓
✅ STORED: "Project" table
✅ STORED: "QuestionItem" table (status='PENDING')
        ↓
USER UPLOADS PDF FILE
        ↓
AWS Textract Processes PDF
Backend Chunks Text
AWS Bedrock Creates Embeddings
        ↓
✅ STORED: "Embedding" table
   - chunk: text content
   - vector: 1536-dim vector
   - source: 'upload'
        ↓
DRAFTWORKER PROCESSES (Auto)
Finds Relevant Chunks via Vector Similarity
AWS Bedrock Claude Generates Answer
        ↓
✅ UPDATED: "QuestionItem" table
   - answer: AI-generated text
   - status: 'NEEDS_REVIEW'
   - confidence: 0.0-1.0
   - citations: JSON array
        ↓
USER REVIEWS ANSWER
Clicks Approve/Reject/Edit
        ↓
✅ UPDATED: "QuestionItem" table
   - status: 'APPROVED' or 'REJECTED'
✅ ADDED: "ReviewEvent" table
   - action: 'approve'/'reject'/'edit'
   - reviewer: user name
   - newAnswer: if modified
```

---

## 🎯 Current Database State

| Table | Count | Purpose |
|-------|-------|---------|
| Project | TBD* | Upload questionnaires |
| QuestionItem | TBD* | Individual questions |
| Embedding | TBD* | PDF chunks as vectors |
| ReviewEvent | TBD* | User review audit trail |

*Run `node verify-db.js` to see current counts

---

## ⚡ Quick Checks

### **Is PostgreSQL Running?**
```bash
# PowerShell
Get-Service | Where-Object {$_.Name -like '*Postgres*'} | Select-Object DisplayName, Status

# Or try to connect
psql -h localhost -U postgres -c "SELECT NOW();"
```

### **Is Database Connected to Backend?**
```bash
cd backend
npm run start:dev

# Look for logs:
# - "[NestFactory] Starting Nest application..."
# - "[InstanceLoader] PrismaModule dependencies initialized"
# 
# If these appear, DB is connected! ✅
```

### **Is Data Being Stored?**
```bash
# Upload an XLSX file via frontend
# Then run:
node verify-db.js
# Should show "Projects: 1" and "Questions: X"
```

---

## 🆘 Troubleshooting

### **"Cannot connect to database"**
```bash
# 1. Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# 2. Check credentials
psql -h localhost -U postgres -c "SELECT NOW();"

# 3. Check .env file
cat backend/.env  # Should show DATABASE_URL
```

### **"No data showing"**
```bash
# Upload test XLSX first!
# Then check:
node verify-db.js

# Data only appears after upload
```

### **"Embeddings not storing"**
```bash
# Upload PDF to knowledge base first!
# Embeddings only created after PDF processed
# Check logs for AWS Bedrock calls
```

---

## 📋 Useful SQL Queries

```sql
-- Total records in all tables
SELECT SUM(n_live_tup) as total_records
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Recent changes (last 24 hours)
SELECT * FROM "QuestionItem" 
WHERE "updatedAt" > NOW() - INTERVAL '24 hours'
ORDER BY "updatedAt" DESC;

-- Find all approved answers
SELECT question, answer FROM "QuestionItem" 
WHERE status = 'APPROVED';

-- Export data as CSV
\COPY (SELECT id, question, answer, status FROM "QuestionItem") TO 'export.csv' CSV HEADER;
```

---

**Try Method 1 (Node.js script) first - it's the easiest! 🚀**

Run: `cd backend && node verify-db.js`
