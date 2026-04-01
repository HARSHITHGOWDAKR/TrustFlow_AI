# Step-by-Step Testing Guide

## 🎯 The No Questions Issue: SOLUTION

**Problem**: No questions showing on `http://localhost:8080/projects`

**Reason**: The database is EMPTY - you haven't uploaded any projects yet!

---

## 📋 FULL TESTING WORKFLOW

### **STEP 1: Create Test XLSX File**

Create a file called `test_questions.xlsx`:

| Question | 
|----------|
| What is machine learning? |
| How does AWS Textract work? |
| What are vector embeddings? |
| How does RAG improve LLMs? |
| What is pgvector? |

---

### **STEP 2: Upload Questionnaire** ✅

1. Go to: `http://localhost:8080/projects`
2. Click "Upload Questionnaire"
3. Select `test_questions.xlsx`
4. Click "Upload & Create Project"

**Expected Result**:
- ✅ Project created
- ✅ Questions appear immediately in the project list (status: PENDING)
- ✅ You see 5 questions listed

**If this works**, your frontend-backend connection is ✅ 

---

### **STEP 3: Verify Questions in Review Queue**

1. Click on the project you just created
2. View should show "Review Queue" tab
3. You should see all 5 questions in PENDING status

**What happens next**:
- Questions wait for AI-generated answers
- Need to upload PDF knowledge base first

---

### **STEP 4: Upload Knowledge Base PDF** 📄

1. Go to: `http://localhost:8080/knowledge-base`
2. Select the project you just created
3. Download this test PDF or create one with sentences about ML:

**Sample PDF content**:
```
Machine Learning Overview

Machine learning is a subset of artificial intelligence that enables 
systems to learn and improve from experience without being explicitly 
programmed. ML algorithms build models based on training data.

AWS Textract

AWS Textract automatically extracts text, forms, and tables from images 
and PDF documents using machine learning. It supports handwritten and 
printed text recognition with high accuracy rates.

Vector Embeddings

Vector embeddings convert text into numerical representations. Each 
embedding is a list of numbers (e.g., 1536 dimensions) where similar 
texts have similar vectors. This enables semantic similarity search.

pgvector

pgvector is a PostgreSQL extension for vector similarity search. It stores 
embeddings as vector types and supports HNSW or IVFFlat indexing for 
fast approximate nearest neighbor search.
```

4. Drag & drop PDF or click to upload
5. Click "Upload Knowledge Base PDF"

**Expected Result**:
- ✅ PDF uploaded
- ✅ AWS Textract parses the PDF
- ✅ Chunks created and embedded
- ✅ Embeddings stored in pgvector
- ✅ Knowledge stats updated

**What happens next**:
- DraftWorker automatically processes PENDING questions
- Uses embeddings to find relevant PDF chunks
- Calls Claude 3.5 Sonnet to generate answers

---

### **STEP 5: Wait & Verify Draft Generation** 🤖

1. Wait **2-3 seconds** for background job processing
2. Go back to Projects
3. Click on the project
4. Click the project and select project name

**Expected Result**:
- ✅ Questions status changed: PENDING → NEEDS_REVIEW
- ✅ AI-generated answer appears for each question
- ✅ Each answer shows citations from PDF

**Example output**:
```
Question: What is machine learning?

Answer: Machine learning is a subset of artificial intelligence 
that enables systems to learn and improve from experience without 
being explicitly programmed. ML algorithms build models based on 
training data.

Citations:
- Source: upload (test.pdf)
- Confidence: 0.95
- Snippet: "Machine learning is a subset of artificial intelligence..."
```

---

### **STEP 6: Review & Approve Answers** ✅

1. In Review Queue, you see generated answers
2. For each answer:
   - ✅ APPROVE → Answer accepted
   - ❌ REJECT → Mark for re-review
   - ✏️ EDIT → Modify and save

3. Click APPROVE on an answer

**Expected Result**:
- ✅ Status changes: NEEDS_REVIEW → APPROVED
- ✅ Answer locked for export

---

### **STEP 7: Export Results** 📥

1. Click "Export Project"
2. Download XLSX file with:
   - Questions (Column A)
   - Approved Answers (Column B)
   - Confidence Scores (Column C)
   - Source/Citations (Column D)

**Expected Result**:
- ✅ XLSX file downloaded
- ✅ All approved answers included

---

## 🔍 AWS Integration Verification

### **During Step 4 (PDF Upload), AWS Should:**

1. **AWS Textract** ✅
   - Extracts text from PDF
   - Backend logs: `"Successfully parsed document via Textract"`

2. **Bedrock Titan Embeddings** ✅
   - Creates vectors for each chunk
   - 1536-dimensional vectors stored in pgvector
   - Backend logs: `"Embedding created for chunk X"`

3. **pgvector Storage** ✅
   - Vectors stored in `Embedding` table
   - Indexed for fast similarity search

### **During Step 5 (Draft Processing), AWS Should:**

1. **Question Embedding** ✅
   - Question gets converted to 1536-dim vector

2. **Similarity Search** ✅
   - pgvector finds top 6 similar chunks from PDF
   - Uses vector similarity (cosine distance)

3. **Bedrock Claude** ✅
   - Receives question + top chunks as context
   - Generates factual answer grounded in knowledge base
   - Returns answer with confidence score

---

## 🐛 Troubleshooting

### **❌ No questions after upload?**
```
Check:
1. Backend logs for upload errors
2. Database: SELECT COUNT(*) FROM "QuestionItem";
3. Check network tab → any 500 errors?
```

### **❌ No answers after waiting?**
```
Check:
1. DraftWorker is running → backend logs show "DraftWorker initialized"
2. Redis running → redis-cli PING
3. Knowledge base actually uploaded
4. Check backend logs for AWS errors
```

### **❌ AWS Bedrock errors?**
```
Logs show:
- "SubscriptionRequiredException" → AWS account not subscribed to Bedrock
- "AccessDeniedException" → IAM permissions missing
- "ThrottlingException" → Too many API calls (implement backoff)
```

### **❌ Textract errors?**
```
Backend will automatically:
- Fall back to local pdf-parse library
- Log: "Using local PDF fallback parser..."
- Still works, but less accurate
```

---

## ✅ Success Checklist

- [ ] XLSX uploaded → Questions appear immediately
- [ ] PDF uploaded → Knowledge base stats updated
- [ ] Answers generated → Status changed to NEEDS_REVIEW
- [ ] Answers have citations → Show source chunks
- [ ] Can approve answers → Status changes
- [ ] Can export results → XLSX downloaded

If all ✅, **AWS integration is working perfectly!**

---

## 📊 Database Queries to Verify Data

```sql
-- Check projects
SELECT COUNT(*) FROM "Project";  -- Should be 1

-- Check questions
SELECT * FROM "QuestionItem" WHERE status IN ('PENDING', 'NEEDS_REVIEW');

-- Check embeddings
SELECT COUNT(*) FROM "Embedding";  -- Should be >10 after PDF upload

-- Check answers
SELECT id, question, status, answer FROM "QuestionItem";
```

---

**Ready?** Start with **STEP 1** and follow through! 🚀
