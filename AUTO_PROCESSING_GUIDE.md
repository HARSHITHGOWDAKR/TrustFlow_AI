# TrustFlow Auto-Processing Workflow

## Overview

The TrustFlow RAG system has been updated to **automatically process questions immediately after upload** without requiring manual intervention. This document explains the complete workflow.

## Key Changes

### 1. ✅ Automatic Knowledge Base Indexing

**Previously**: Knowledge base policies were stored in the database but NOT indexed in Pinecone.

**Now**: When a knowledge base policy is uploaded:
```
Policy Upload
    ↓
    ├─ Store in PostgreSQL
    │
    ├─ AUTO: Chunk the policy (450 chars each)
    │
    ├─ AUTO: Generate embeddings (Gemini API or synthetic fallback)
    │
    └─ AUTO: Index vectors in Pinecone
```

**Implementation**: Modified `KnowledgeBaseService.addPolicy()` to call `indexPolicyInPinecone()` automatically.

### 2. ✅ Automatic Question Processing

**Previously**: Questions uploaded but needed manual "Start" button click.

**Now**: When questions are uploaded:
```
Upload Questions (.xlsx)
    ↓
    ├─ Create Project
    │
    ├─ Store Questions in Database (status: PENDING)
    │
    └─ AUTO: Enqueue DraftWorker job
        ↓
        └─ BullMQ processes each question through 4-agent pipeline
            ├─ 1️⃣  INTAKE: Classify & expand query
            ├─ 2️⃣  RETRIEVAL: Search Pinecone for relevant chunks
            ├─ 3️⃣  DRAFTER: Generate answer with retrieved context
            └─ 4️⃣  CRITIC: Evaluate confidence & citations
                ↓
                └─ AUTO: Save results to Database
```

**Implementation**: `ProjectsController.uploadQuestions()` already calls `draftWorker.enqueueDraft(project.id)`.

### 3. ✅ Automatic Database Updates

All results are automatically persisted:
```sql
UPDATE question_items SET
  answer = <generated_answer>,
  confidence = <computed_score>,
  citations = <extracted_citations>,
  status = <DRAFTED|NEEDS_REVIEW>,
  intakeCategory = <category>,
  expandedQuery = <expanded_query>,
  retrievedChunksData = <json>,
  verificationStatus = <PASS|FAIL>,
  processingTimeMs = <milliseconds>
WHERE id = <question_id>
```

### 4. ✅ Removed "Start" Button from Frontend

**Before**: Dashboard had a "Start" button for demo mode.
**After**: Shows "Auto-Processing Active" with live status indicator.

**Changes**: 
- Removed demo mode button from Projects.tsx
- Added real-time status polling (every 2 seconds)
- Auto-loads project and questions after upload
- Shows processing progress live

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  UPLOAD FLOW (Auto-Processing)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend                Backend                Database     │
│  ────────               ────────                ────────     │
│                                                              │
│  Upload QA.xlsx ────>  ProjectsController      PostgreSQL   │
│                              ↓                      ↓        │
│                        Create Project         questions      │
│                              ↓                   (PENDING)   │
│                        enqueueDraft ────────────────────>   │
│                              ↓                               │
│  Auto-Poll          DraftWorker (BullMQ)                    │
│  Status ←───────────────────↓                              │
│  Updates                 agentsService                      │
│                              ↓                              │
│                    Process via 4-agent                      │
│                    pipeline:                                │
│                    ├─ Intake (Gemini)                       │
│                    ├─ Retrieval (Pinecone)                  │
│                    ├─ Drafting (Mistral HF)                 │
│                    └─ Criticism (Gemini)                    │
│                              ↓                              │
│  Display ←──────────────── Update DB ───────────────────>   │
│  Results                 (DRAFTED/PASSED)     questions     │
│                                             (with answers)  │
└─────────────────────────────────────────────────────────────┘
```

## Workflow Steps

### Step 1: Upload Questions File
```bash
POST /projects/upload
Content-Type: multipart/form-data
File: questions.xlsx (Question column)
```

**Response**:
```json
{
  "project": {
    "id": 47,
    "name": "Project 2026-04-02T03:54:51.534Z",
    "createdAt": "2026-04-02T03:54:51.534Z"
  },
  "message": "Questions uploaded and queued for processing..."
}
```

### Step 2: Auto-Enqueue Processing
The backend automatically:
1. Creates project record
2. Stores questions as PENDING
3. Enqueues DraftWorker job
4. Returns project info

**Database State**:
```
Projects: [47]
QuestionItems: 39 rows, all status='PENDING'
```

### Step 3: BullMQ Worker Processes
Worker picks up the job and:
1. Retrieves all PENDING questions for project
2. Processes each through 4-agent pipeline
3. Updates status on each completion

**Processing Flow** (per question):
```
PENDING
  ↓ (Start)
PROCESSING [+ Intake Agent runs]
  ↓
PROCESSING [+ Retrieval Agent runs - queries Pinecone]
  ↓
PROCESSING [+ Drafter Agent runs - generates answer]
  ↓
PROCESSING [+ Critic Agent runs - evaluates confidence]
  ↓
DRAFTED (confidence >= 0.5 threshold)
  ↓ (or)
NEEDS_REVIEW (confidence < 0.5 or verification failed)
```

### Step 4: Frontend Auto-Updates
Frontend polls for status every 2 seconds:
```
GET /projects/47/review
```

Displays:
- Running count: "Processing X/39 questions"
- Individual progress bars
- Real-time confidence scores
- Processing timeline

### Step 5: Storage and Display
Results auto-saved to database:
```
QuestionItem:
{
  id: 1,
  projectId: 47,
  question: "What is data retention policy?",
  status: "DRAFTED",
  answer: "According to section 3.2... retention is 30 days",
  confidence: 0.87,
  citations: [
    { snippet: "retention period 30 days after termination",
      source: "Section 3.2",
      score: 0.92 }
  ],
  intakeCategory: "data-protection",
  expandedQuery: "data retention storage period customer information...",
  processingTimeMs: 18500
}
```

## Configuration

### Environment Variables
```bash
# Backend .env
GEMINI_API_KEY=<your-key>           # For Intake/Critic agents
PINECONE_API_KEY=<your-key>         # Vector DB
PINECONE_INDEX=trustflow-index      # Index name (1024D)
HUGGINGFACE_API_KEY=<your-key>      # For Drafter agent
DATABASE_URL=postgresql://...       # Results storage
REDIS_HOST=localhost                # BullMQ queue
REDIS_PORT=6379
```

### BullMQ Settings
```typescript
// draft.worker.ts
lockDuration: 60000,      // 60s - time allowed per job
lockRenewTime: 15000,     // Renew every 15s
```

### Processing Thresholds
```typescript
// draft.worker.ts
confidence >= 0.5: "DRAFTED"        // Ready for review
confidence < 0.5:  "NEEDS_REVIEW"   // Manual review needed
verificationFailed: "NEEDS_REVIEW"  // Failed critic check
```

## API Endpoints

### Upload Questions (Triggers Auto-Process)
```bash
POST /projects/upload
Content-Type: multipart/form-data

Response: { project, message }
Auto-effects:
  ✓ Project created
  ✓ Questions stored (PENDING)
  ✓ Processing enqueued
```

### Get Project Review Data
```bash
GET /projects/:id/review

Response: { questions: QuestionsWithAnswers[] }
Includes:
  ✓ All questions
  ✓ Answers (if processed)
  ✓ Confidence scores
  ✓ Citations
  ✓ Processing metadata
```

### Add Knowledge Base Policy (Triggers Auto-Index)
```bash
POST /knowledge-base/projects/:id/policies
{
  "title": "Policy Name",
  "content": "Policy content...",
  "category": "Security",
  "source": "MANUAL",
  "isActive": true
}

Auto-effects:
  ✓ Policy stored in PostgreSQL
  ✓ Chunked (450 chars each)
  ✓ Embedded (Gemini or synthetic)
  ✓ Indexed in Pinecone
```

## Frontend Updates

### Projects Page Changes

**Removed**:
- Demo "Start" button
- Manual processing trigger

**Added**:
- "Auto-Processing Active" status indicator
- Live polling (every 2 seconds)
- Auto-project selection after upload
- Real-time progress display

### Auto-Refresh Mechanism
```typescript
// Polls when PENDING or PROCESSING items exist
useEffect(() => {
  if (!pendingItems) return;
  
  const interval = setInterval(async () => {
    const response = await fetch(`/projects/${id}/review`);
    setReviewItems(response.data.questions);
  }, 2000); // 2 second poll
  
  return () => clearInterval(interval);
}, [selectedProject, reviewItems]);
```

## Performance Metrics

### Expected Processing Time
- **Per Question**: 15-25 seconds average
- **For 39 Questions**: 10-20 minutes total
- **Parallelization**: Can process multiple in parallel with scaled workers

### Resource Usage
- **PostgreSQL**: Stores questions, answers, metadata
- **Pinecone**: 17 knowledge base chunks (1024D vectors)
- **Redis**: BullMQ queue (1 job per question)
- **Memory**: ~200MB per worker instance

## Monitoring & Debugging

### Check Processing Status
```bash
# Get live question status
curl http://localhost:3000/projects/47/review

# Check database directly
SELECT id, question, status, confidence 
FROM question_items 
WHERE projectId = 47
ORDER BY id;
```

### View Agent Logs
```bash
# Backend console shows:
# [DraftWorker] ✅ Q1: DRAFTED (confidence 87%, 18500ms)
# [DraftWorker] ✅ Q2: NEEDS_REVIEW (confidence 42%, 22100ms)
```

### Troubleshooting

**Issue**: Questions stuck in PENDING
- Check DraftWorker is running: `npm run start:dev`
- Verify Redis running: `redis-cli ping` (should return PONG)
- Check KB indexed: Verify Pinecone has vectors for project

**Issue**: Low confidence scores
- Verify KB policy uploaded and indexed
- Check Pinecone index has data: `ncl index describe trustflow-index`
- Ensure knowledge base content matches question topics

**Issue**: Processing takes too long
- Normal: 15-25 seconds per question
- Check backend logs for API timeouts
- Verify Gemini/HuggingFace API keys valid

## Testing

### Run Auto-Processing Test
```bash
cd backend
node test-auto-processing.js
```

This will:
1. Create fresh project
2. Upload KB policy (auto-indexed)
3. Upload 10 test questions (auto-processed)
4. Poll until complete (5 min timeout)
5. Display results and metrics

## Migration from Manual to Auto

If you have existing projects:

### Option 1: Re-upload Questions
Simply upload the questions file again:
```bash
POST /projects/upload
```
Auto-processing will start immediately.

### Option 2: Manual Trigger (Legacy)
If you need to trigger manually:
```bash
# This is still possible but not needed
POST /agents/process-project
{ "projectId": 47 }
```

## Summary

| Feature | Before | After |
|---------|--------|-------|
| KB Indexing | Manual | Automatic |
| Processing Trigger | Manual button | Automatic on upload |
| Database Updates | Manual | Automatic |
| Status Polling | None | Every 2 seconds |
| User Action Required | Upload + Click Start | Upload only |
| Processing Time | Visible in logs | Live in UI |
| End Result | Questions unanswered | Questions answered with scores |

## Next Improvements

- [ ] Batch question uploads for bulk processing
- [ ] Real-time WebSocket updates instead of polling
- [ ] Processing priority queue (urgent vs standard)
- [ ] Scheduled recurring question processing
- [ ] Multi-KB support per project
- [ ] Custom embedding model selection
- [ ] Processing pause/resume
- [ ] Automatic retry on failure

---

**System Status**: ✅ Production Ready  
**Last Updated**: 2026-04-02
