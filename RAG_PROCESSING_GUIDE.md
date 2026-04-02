# RAG Processing & Confidence Scoring System

## Overview

The RAG (Retrieval-Augmented Generation) system provides complete visibility into how questions are processed, what content is retrieved, and how confident the system is in its answers. The system includes:

- **Real-time RAG pipeline visualization** - See each step of the retrieval process
- **Confidence scoring** - Measure answer reliability based on retrieval quality
- **Processing history** - Track all processed questions and their outcomes
- **Health scoring** - Monitor overall system performance

---

## RAG Processing Pipeline

The RAG pipeline consists of 5 stages:

### Stage 1️⃣: Question Intake (10ms avg)
- Question is extracted from the questionnaire
- Text is validated and normalized
- Question metadata is stored for tracing

**What happens:**
```
Input: "What are the security policies for access control?"
Output: Validated question with metadata
```

### Stage 2️⃣: Query Expansion (120ms avg)
- Original question is expanded into multiple phrasings
- Alternative keywords and synonyms are generated
- This improves retrieval coverage

**Example expansions:**
- "security policies access control" (original)
- "access control security requirements" (variant 1)
- "authentication authorization policies" (variant 2)

### Stage 3️⃣: Vector Search (150ms avg)
- Query is converted to 1024-dimensional embedding
- Pinecone vector database is searched
- Top matching chunks are retrieved based on similarity

**What's happening:**
```
Query Vector (1024 dimensions)
          ↓
    Pinecone Search
          ↓
    Return Top Matches (by cosine similarity)
```

### Stage 4️⃣: Chunk Ranking (80ms avg)
- Retrieved chunks are ranked by similarity score
- Scores range from 0.0 (no match) to 1.0 (perfect match)
- Higher ranked chunks are prioritized

**Similarity Score Interpretation:**
- **> 0.8 (80%):** Highly relevant, excellent match
- **0.6-0.8 (60-80%):** Relevant, good match
- **0.4-0.6 (40-60%):** Somewhat relevant, partial match
- **< 0.4 (40%):** Weak match, may need manual review

### Stage 5️⃣: Confidence Scoring (40ms avg)
- Final confidence score is calculated
- Based on multiple factors (see below)
- Score indicates reliability of the answer

**Total Processing Time: ~400ms average**

---

## Confidence Score Calculation

The system calculates confidence based on 3 weighted factors:

### Factor 1: Top Chunk Similarity (40% weight)
```
Score = Highest similarity score among retrieved chunks
Example: If best match is 77% similar → contributes 77% × 0.4 = 30.8%
```

### Factor 2: Retrieval Count (30% weight)
```
Score = (Number of relevant chunks / max expected chunks)
Example: If 3 relevant chunks retrieved out of 5 max → 60% × 0.3 = 18%
```

### Factor 3: Score Consistency (30% weight)
```
Score = (1 - standard deviation of scores)
Example: If all retrieved chunks have similar scores → high consistency
```

### Combined Formula:
```
Final Confidence = 
  (Top Similarity × 0.4) + 
  (Retrieval Count × 0.3) + 
  (Score Consistency × 0.3)
```

**Example Calculation:**
```
Question: "What are the security policies for access control?"

Retrieved Chunks:
1. security-policy.txt - Chunk 2 (77% similarity) ✅ BEST MATCH
2. security-policy.txt - Chunk 1 (52% similarity) ➡️  OK
3. security-policy.txt - Chunk 0 (13% similarity) ⚠️  WEAK

Calculation:
- Top Similarity: 77% × 0.4 = 30.8%
- Retrieval Count: (3 relevant) / 5 × 0.3 = 18%
- Consistency: (1 - 0.32) × 0.3 = 20.4%
─────────────────────────────
Final Confidence: 69.2% ✅
```

---

## Confidence-Based Recommendations

### High Confidence (80%+) ✅
**Status:** Ready to use
- Use these answers directly in responses
- Minimal manual review needed
- High reliability for compliance

**Backend returns:**
```json
{
  "confidence": 0.85,
  "recommendation": "Use these answers with high confidence"
}
```

### Medium Confidence (60-80%) ⚠️
**Status:** Requires review
- Cross-reference with additional sources
- Have human verify before publishing
- Suitable for draft stage, needs confirmation

**Backend returns:**
```json
{
  "confidence": 0.72,
  "recommendation": "Verify with human review or additional sources"
}
```

### Low Confidence (<60%) ❌
**Status:** Requires rework
- Knowledge base may be incomplete
- Additional document uploads recommended
- Manual research and answer drafting needed

**Backend returns:**
```json
{
  "confidence": 0.45,
  "recommendation": "Requires manual review or knowledge base expansion"
}
```

---

## RAG Endpoints Overview

### 1. Process Question Through RAG Pipeline
```
POST /projects/:projectId/rag/process-question
Content-Type: application/json

Request Body:
{
  "questionId": 1,
  "question": "What are the security policies?"
}

Response:
{
  "success": true,
  "data": {
    "questionId": 1,
    "question": "What are the security policies?",
    "retrievedChunks": [
      {
        "id": 1,
        "source": "security-policy.txt",
        "chunkIndex": 2,
        "chunk": "content...",
        "similarity": 0.77,      // 77% match
        "rank": 1                // Best match
      }
      // ... more chunks
    ],
    "confidenceScore": 0.692,    // 69.2%
    "processingSteps": [
      {
        "step": 1,
        "name": "Question Intake",
        "status": "completed",
        "duration": 10,
        "details": "Question extracted and validated"
      }
      // ... more steps
    ],
    "totalProcessingTime": 400   // ms
  }
}
```

### 2. Get RAG Statistics
```
GET /projects/:projectId/rag/stats

Response:
{
  "success": true,
  "stats": {
    "totalQuestions": 50,
    "questionsProcessed": 45,
    "totalRetrievals": 135,
    "avgChunksPerRetrieval": 3,
    "avgConfidenceScore": 0.72,      // 72% average
    "avgSimilarityScore": 0.65,      // 65% average
    "topSimilarityThreshold": 0.85   // 85th percentile
  }
}
```

### 3. Get Confidence Threshold Analysis
```
GET /projects/:projectId/rag/confidence-threshold

Response:
{
  "success": true,
  "confidenceDistribution": {
    "high": {
      "count": 32,
      "percentage": "71.1%",
      "recommendation": "Use these answers with high confidence"
    },
    "medium": {
      "count": 12,
      "percentage": "26.7%",
      "recommendation": "Verify with human review"
    },
    "low": {
      "count": 1,
      "percentage": "2.2%",
      "recommendation": "Requires manual review"
    }
  },
  "overallHealthScore": 78.5,
  "recommendations": [
    "✅ RAG system is performing excellently",
    "📋 Review medium-confidence results",
    "✅ Low-confidence results are minimal"
  ]
}
```

### 4. Get Processing History
```
GET /projects/:projectId/rag/history

Response:
{
  "success": true,
  "totalProcessed": 45,
  "averageConfidence": "72%",
  "history": [
    {
      "questionId": 1,
      "question": "What are the access control policies?",
      "retrievedChunks": [ /* ... */ ],
      "confidenceScore": 0.77,
      "processingSteps": [ /* ... */ ],
      "totalProcessingTime": 412
    }
    // ... more history
  ]
}
```

### 5. Get Complete RAG Summary
```
GET /projects/:projectId/rag/summary

Response:
{
  "success": true,
  "stats": { /* ... */ },
  "processingHistory": {
    "total": 45,
    "averageProcessingTime": "412ms",
    "fastestProcessing": "285ms",
    "slowestProcessing": "680ms"
  },
  "confidenceDistribution": { /* ... */ },
  "overallHealthScore": 78.5,
  "recommendations": [ /* ... */ ]
}
```

---

## Frontend Components

### RAGDashboard Component
Located: `frontend/src/components/RAGDashboard.tsx`

**Features:**
- View RAG processing pipeline visualization
- See real-time statistics (questions processed, confidence scores)
- View detailed chunks with similarity scores
- Monitor processing performance metrics
- Interactive processing timeline view

**Tab Views:**
1. **Overview** - High-level stats and pipeline
2. **Detailed** - Select and analyze specific questions
3. **Timeline** - Processing history and performance trends

### ConfidenceRecommender Component
Located: `frontend/src/components/ConfidenceRecommender.tsx`

**Features:**
- Filter results by confidence level
- See confidence distribution charts
- Get AI recommendations for improving RAG quality
- Monitor system health score
- Processing performance metrics

**Confidence Levels:**
- High Confidence (80%+) - Green, ready to use
- Medium Confidence (60-80%) - Yellow, needs review
- Low Confidence (<60%) - Red, needs rework

---

## Example Workflow

### Step 1: User Asks Question
```
User Question: "What is our backup and recovery procedure?"
```

### Step 2: Backend Processes Through RAG
```
1. Expand query variations
2. Search Pinecone vectors
3. Retrieve top 3-5 chunks
4. Rank by similarity (77%, 52%, 13%)
5. Calculate confidence: 65%
```

### Step 3: Frontend Displays Results
- **Status:** Medium Confidence (65%) ⚠️
- **Top Match:** 77% similar
- **Recommendation:** "Verify with human review"
- **Retrieved Content:** Shows 3 chunks from policy documents

### Step 4: User Action
- **Option A (High Confidence):** Approve and publish
- **Option B (Medium Confidence):** Review and verify
- **Option C (Low Confidence):** Flag for manual research

---

## System Health Scoring

The overall system health is calculated as:

```
Health Score = 
  (High Confidence Count × 1.0) +
  (Medium Confidence Count × 0.6) +
  (Low Confidence Count × 0.2)
  ─────────────────────────────────────────
         Total Questions
```

**Health Score Interpretation:**
- **> 80%:** Excellent - RAG system is working well
- **60-80%:** Good - System is functional with room for improvement
- **40-60%:** Adequate - Knowledge base needs expansion
- **< 40%:** Poor - Significant improvements needed

---

## Improving RAG Performance

### To Increase Overall Confidence:

1. **Expand Knowledge Base**
   - Upload more relevant documents
   - Include domain-specific resources
   - Add FAQ and policy documents

2. **Refine Query Expansion**
   - Better keyword extraction
   - Domain-specific synonyms
   - Better phrasings

3. **Optimize Chunk Size**
   - Larger chunks capture more context
   - Smaller chunks are more specific
   - Balance based on content type

4. **Adjust Similarity Thresholds**
   - Currently: 0.5 = relevant chunk standard
   - Can be tuned based on domain

---

## Confidence Score Thresholds in Frontend

The frontend uses the following color coding:

```typescript
// High Confidence (80%+)
color: 'emerald-600'
badge: '✅ Reliable'

// Medium Confidence (60-80%)
color: 'blue-600'
badge: '⚠️ Review'

// Low Confidence (<60%)
color: 'yellow-600'
badge: '❌ Verify'
```

---

## API Routes Summary

```
POST   /projects/:projectId/rag/process-question    Process single question
GET    /projects/:projectId/rag/stats               Get system statistics
GET    /projects/:projectId/rag/history             Get processing history
GET    /projects/:projectId/rag/question/:id        Get specific question data
GET    /projects/:projectId/rag/all-data            Get all RAG data
GET    /projects/:projectId/rag/confidence-threshold Get confidence analysis
GET    /projects/:projectId/rag/summary             Get complete summary
```

---

## Testing

Run the comprehensive test suite:
```bash
cd backend
node test-rag-endpoints.js
```

Expected output:
- ✅ Question processing verification
- ✅ RAG statistics validation
- ✅ Processing history tracking
- ✅ Confidence threshold analysis
- ✅ Complete RAG summary
- ✅ Question-specific data retrieval
- ✅ Multi-question workflow simulation

---

## Summary

The RAG system provides:
1. **Transparency:** See exactly how questions are processed
2. **Confidence Scoring:** Know how reliable each answer is
3. **Performance Metrics:** Track system efficiency
4. **Actionable Recommendations:** Improve RAG quality
5. **Complete History:** Track all processing events

This enables users to trust the system's answers based on confidence levels and make informed decisions about which results to use directly, review, or rework.
