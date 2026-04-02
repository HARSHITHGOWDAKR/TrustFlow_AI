# RAG System Quick Reference

## What is RAG?

**Retrieval-Augmented Generation** - Uses your knowledge base to provide context-aware answers with confidence scoring.

```
Question → RAG Pipeline → Retrieved Chunks → Confidence Score → Answer
```

---

## 5-Step RAG Pipeline Summary

| Step | Name | Duration | What It Does |
|------|------|----------|-------------|
| 1 | Question Intake | 10ms | Validates question input |
| 2 | Query Expansion | 120ms | Creates alternative phrasings |
| 3 | Vector Search | 150ms | Finds matching chunks in Pinecone |
| 4 | Chunk Ranking | 80ms | Sorts by similarity score |
| 5 | Confidence Scoring | 40ms | Calculates answer reliability |
| **Total** | | **~400ms** | |

---

## Confidence Score Ranges

```
80%+ :  ✅ HIGH     → Use directly, minimal review
60-80%: ⚠️  MEDIUM  → Verify before publishing
<60%:  ❌ LOW      → Requires manual research
```

---

## Frontend Tabs

### RAG Insights Tab 📊
**What To Do:**
1. Choose view: Overview, Detailed, or Timeline
2. See RAG statistics and pipeline
3. Click on questions to analyze details
4. View retrieved chunks and confidence

**Best For:** Understanding HOW RAG works

### Confidence Tab 🎯
**What To Do:**
1. View overall system health score
2. Filter by confidence level
3. Read recommendations
4. Understand what actions to take

**Best For:** Knowing which results to use

---

## Quick Decision Tree

```
START: New question processed
   ↓
CONFIDENCE SCORE CALCULATED?
├─ YES → Continue
└─ NO → Check backend logs

CONFIDENCE > 80%?
├─ YES → ✅ USE DIRECTLY
│        (Ready for publication)
└─ NO → Continue

CONFIDENCE 60-80%?
├─ YES → ⚠️  REVIEW FIRST
│        (Verify with human)
└─ NO → Continue

LOW CONFIDENCE < 60%?
└─ YES → ❌ REWORK NEEDED
         (Research/expand KB)
```

---

## Backend API Quick Reference

```bash
# Process a question
POST /projects/36/rag/process-question
{"questionId": 1, "question": "What is...?"}

# Get statistics
GET /projects/36/rag/stats

# Get recommendations
GET /projects/36/rag/confidence-threshold

# Get complete summary
GET /projects/36/rag/summary
```

---

## Confidence Score Calculation Formula

```
Final Score = (Top Similarity × 0.4) +
              (Retrieval Count × 0.3) +
              (Score Consistency × 0.3)

Example: 77% × 0.4 + 60% × 0.3 + 68% × 0.3 = 69.2%
```

---

## Improving RAG Performance

### If confidence scores are LOW:
1. **Upload more documents** → Better chunk coverage
2. **Add FAQ documents** → Common questions answered
3. **Upload policy docs** → Official guidelines captured

### If specific chunks not found:
1. Go to **Knowledge Base tab**
2. Check **Chunk Viewer**
3. Search for missing content
4. Upload documents containing it

### If results are inconsistent:
1. Verify **Query Expansion** is working
2. Check **Chunk Quality** is good
3. Review **Vector Search** results
4. Expand knowledge base coverage

---

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| No data showing | Backend running? Check port 3000 |
| Confidence always low | Upload more documents |
| Slow processing | Check backend logs, may be indexing |
| Chunks not retrieved | Add more KB documents |
| Scores not updating | Refresh page, process new questions |

---

## Key Metrics to Monitor

- **Average Confidence:** Target > 75%
- **High Confidence %:** Target > 70% of questions
- **Processing Time:** Target < 500ms
- **Chunk Retrieval:** Target 3-5 chunks per question

---

## Workflow: End-to-End

```
1. USER UPLOADS: Document
   ↓
2. BACKEND: Chunks document, generates embeddings
   ↓
3. USER ASKS: Question
   ↓
4. RAG PIPELINE: Processes through 5 stages
   ↓
5. SYSTEM: Returns answer + confidence
   ↓
6. USER DECISION:
   - 80%+? → Approve
   - 60-80%? → Verify
   - <60%? → Research more
```

---

## File Locations

| Component | Location |
|-----------|----------|
| RAGDashboard | `frontend/src/components/RAGDashboard.tsx` |
| ConfidenceRecommender | `frontend/src/components/ConfidenceRecommender.tsx` |
| RAGService | `backend/src/trustflow-knowledge/rag.service.ts` |
| RAGController | `backend/src/trustflow-knowledge/rag.controller.ts` |

---

## Testing RAG System

```bash
# Run comprehensive test
cd backend
node test-rag-endpoints.js

# Expected tests:
✅ Process Question
✅ Get Statistics
✅ Get History
✅ Get Recommendations
✅ Get Summary
✅ Get Question Data
✅ Multi-Question Workflow
```

---

## Color Coding Reference

```
🟢 Green (Emerald)   = High Confidence 80%+
🔵 Blue             = Medium Confidence 60-80%
🟡 Yellow           = Low Confidence <60%
```

---

## Next Steps

1. **Understand:** Read `RAG_PROCESSING_GUIDE.md` for details
2. **Explore:** Try RAG Insights and Confidence tabs
3. **Test:** Run test script to verify endpoints
4. **Improve:** Upload more documents to boost confidence
5. **Monitor:** Track system health score over time

---

## Quick Commands

```bash
# Build backend
npm run build

# Start backend
cd backend && node dist/main.js

# Start frontend
cd frontend && npm run dev

# Test RAG
cd backend && node test-rag-endpoints.js

# Kill all node processes
taskkill /IM node.exe /F
```

---

## Contact/Support

For detailed information:
- Backend: See `RAG_PROCESSING_GUIDE.md`
- Frontend: See `RAG_FRONTEND_GUIDE.md`
- Architecture: Check Projects page Architecture tab
