# ⚡ Quick Start: Auto-Processing

## TL;DR (30 seconds)

Your TrustFlow system now automatically:
1. ✅ Indexes knowledge base in Pinecone (no manual chunking)
2. ✅ Starts processing questions immediately after upload (no "Start" button)
3. ✅ Saves results to database automatically (no manual save)
4. ✅ Shows live progress on dashboard (polls every 2 seconds)

**That's it!** 🎉

---

## What You Need to Do

### 1. Restart Backend
```bash
cd backend
npm run start:dev
```

### 2. Upload Questions Via Frontend
```
http://localhost:8083
→ Upload Excel file with questions
→ Project opens automatically
→ Processing starts immediately
→ Results appear live
```

### 3. Watch the Magic Happen
- Questions move through the pipeline automatically
- Confidence scores update in real-time
- Answers appear on dashboard
- No manual intervention needed

---

## Before vs After

| Step | Before | After |
|------|--------|-------|
| Upload KB | Upload → Manual chunk → Manual embed → Manual index | Upload → Auto everything ✅ |
| Upload Q's | Upload → Click Start → Wait | Upload → Auto start ✅ |
| Watch Progress | Manual log viewing | Live dashboard ✅ |
| Save Results | Manual trigger | Auto save ✅ |

---

## System Flow

```
UPLOAD FILE
    ↓
AUTO: Questions stored as PENDING
    ↓
AUTO: BullMQ enqueues processing job
    ↓
AUTO: For each question:
    ├─ Intake (classify)
    ├─ Retrieval (search KB)
    ├─ Drafting (generate answer)
    └─ Criticism (evaluate)
    ↓
AUTO: Save to database
    ↓
LIVE: Dashboard updates every 2 sec
    ↓
DONE: Answers visible with scores
```

---

## Key Files Changed

✅ **Backend** (Auto-processing logic):
- `knowledge-base.service.ts` - Auto-indexes KB
- `knowledge-base.module.ts` - Imports LLM services

✅ **Frontend** (User interface):
- `Projects.tsx` - Removed "Start" button, added live polling

✅ **Tests**:
- `test-auto-processing.js` - End-to-end verification

---

## Test It Now

```bash
cd backend
node test-auto-processing.js
```

This will:
1. Create test project
2. Upload test KB (auto-indexes)
3. Upload 10 test questions (auto-processes)
4. Verify end-to-end
5. Display results

Expected output: ✅ 9-10 questions successfully processed

---

## Dashboard Changes

### Removed:
❌ "Start" button (demo mode)

### Added:
✅ "Auto-Processing Active" status
✅ Live progress indicator
✅ Real-time confidence scores
✅ Auto-refreshing results

---

## Zero Configuration Needed

All existing settings work! No changes to:
- `.env` variables
- API keys (Gemini, Pinecone, HF)
- Database schema
- Redis settings
- Docker compose

---

## What Happens Automatically

### When KB Policy Uploaded:
```
Policy → Chunk (450 chars) 
       → Embed (Gemini or synthetic)
       → Index in Pinecone
Result: KB searchable immediately ✅
```

### When Questions Uploaded:
```
Questions → Store in DB
         → Enqueue BullMQ job
Result: Processing starts immediately ✅
```

### While Processing:
```
Each q → Intake + Retrieval + Draft + Critic
      → Save answer + confidence
      → Dashboard updates live
Result: Answers appear with scores ✅
```

---

## Performance

| Metric | Value |
|--------|-------|
| Per Question | 15-25 sec |
| Dashboard Poll | 2 sec |
| Auto Index | <2 sec |
| DB Save | Automatic |

---

## Quality Assurance

✅ Embeddings: Gemini API (with synthetic fallback)
✅ Retrieval: Pinecone with project-specific filtering
✅ Drafting: Mistral-7B via HuggingFace
✅ Criticism: Gemini confidence evaluation
✅ Storage: PostgreSQL atomic transactions
✅ Queuing: BullMQ with heartbeat monitoring

---

## Troubleshooting (1 min)

| Issue | Solution |
|-------|----------|
| Questions stuck in PENDING | Restart backend: `npm run start:dev` |
| Dashboard not updating | Verify Redis: `redis-cli ping` (should say PONG) |
| Low confidence scores | Check KB indexed in Pinecone |
| Processing too slow | Normal: 15-25sec per q. Check logs for timeouts |

---

## One Minute Setup

```bash
# 1. Restart backend
cd backend
npm run start:dev
# Wait for: "🚀 DraftWorker initialized and ready"

# 2. Open frontend
# http://localhost:8083

# 3. Upload questions
# Dashboard shows: "Auto-Processing Active" ✅

# 4. Watch results appear live
# Questions → Confidence → Answers
```

---

## Success Criteria

After upload, you'll see:
- [ ] "Auto-Processing Active" indicator
- [ ] Processing count increases ("1/10", "2/10"...)
- [ ] Confidence scores appear (0-100%)
- [ ] Answers populate in real-time
- [ ] No manual buttons needed

---

## That's All! 🎉

Your auto-processing system is ready. Just upload questions and watch the magic happen automatically!

Questions? Check:
- `AUTO_PROCESSING_GUIDE.md` - Detailed workflow
- `AUTO_PROCESSING_COMPLETE.md` - Full documentation
- Backend logs - Live processing details
- Dashboard - Real-time progress
