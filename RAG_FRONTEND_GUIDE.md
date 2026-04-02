# RAG Frontend Components Guide

## Overview

The RAG system includes two main frontend components that visualize RAG processing and provide confidence-based filtering:

1. **RAGDashboard** - Real-time visualization of RAG pipeline
2. **ConfidenceRecommender** - Confidence-based filtering and recommendations

Both components are integrated into the Projects page as new tabs.

---

## RAGDashboard Component

### Location
`frontend/src/components/RAGDashboard.tsx`

### Where It's Used
Projects page → **RAG Insights** tab

### Features

#### 1. Overview Mode 📊
Shows high-level RAG pipeline metrics and performance.

**Displays:**
- **Questions Processed** - Current/total questions [0/50]
- **Total Retrievals** - How many chunks retrieved [135]
- **Avg Confidence** - Average confidence score [72%]
- **Avg Similarity** - Average top match similarity [65.1%]

**RAG Pipeline Visualization:**
- 5-stage pipeline diagram
- Question Intake → Query Expansion → Vector Search → Chunk Ranking → Confidence Scoring
- Each stage shows purpose and typical duration

**Processing Performance:**
- Avg Query Expansion Time: 120ms
- Avg Vector Search Time: 150ms
- Avg Ranking Time: 80ms
- Total Processing: 350ms average

#### 2. Detailed Mode 🔍
Analyze specific questions and their RAG processing details.

**How to Use:**
1. Click on any question from the list (top 10 shown)
2. View deep processing details
3. See all retrieved chunks with individual similarity scores
4. Analyze confidence score breakdown

**Shows:**
- Original question text
- Detailed processing steps with timing
- Retrieved chunks ranked by similarity
- Visual similarity bars
- Confidence score calculation breakdown

**Processing Steps Shown:**
```
Step 1: Question Intake ✅ (10ms)
Step 2: Query Expansion ✅ (120ms)
Step 3: Vector Search ✅ (150ms)
Step 4: Chunk Ranking ✅ (80ms)
Step 5: Confidence Scoring ✅ (40ms)
```

**Chunk Details:**
```
Rank: 1 (highest)
Source: security-policy.txt - Chunk 2
Content: [First 150 chars of chunk]
Similarity: 77% [Visual bar]
```

**Confidence Factors:**
- Top Chunk Similarity: 77% (weight: 40%)
- Retrieval Count: 60% (weight: 30%)
- Score Consistency: 68% (weight: 30%)
- **Final: 69.2%**

#### 3. Timeline Mode ⏱️
View processing history and confidence distribution over time.

**Shows:**
- Recent processing events on timeline
- Each event shows:
  - Processing time (⏱️ 412ms)
  - Chunk count (📦 3 chunks)
  - Confidence (✅ 77% confidence)
  - Confidence badge (High/Medium/Low)

**Confidence Distribution:**
- High (80-100%): Green bar - X questions
- Medium (60-80%): Blue bar - Y questions
- Low (<60%): Yellow bar - Z questions

---

## ConfidenceRecommender Component

### Location
`frontend/src/components/ConfidenceRecommender.tsx`

### Where It's Used
Projects page → **Confidence** tab

### Features

#### RAG System Health 💯
**Overall Health Score Card:**
- Large percentage display (e.g., 78%)
- Status indicator (animated pulse for good health)
- Status message:
  - ✅ "System is performing excellently" (>75%)
  - ⚠️ "System is performing adequately" (50-75%)
  - ❌ "System needs improvement" (<50%)

#### Confidence Level Filter 🎯
**Filter Buttons:**
- All Results
- High (80%+) - Shows count
- Medium (60-80%) - Shows count
- Low (<60%) - Shows count

Clicking a filter highlights that confidence level and dims others.

#### Confidence Distribution Cards 📊
Three visual cards showing:

**High Confidence (80%+) ✅**
- Count: 32 results
- Percentage: 71.1%
- Recommendation: "Use these answers with high confidence"
- Progress bar (full green)
- Status badge: "✅ Reliable"

**Medium Confidence (60-80%) ⚠️**
- Count: 12 results
- Percentage: 26.7%
- Recommendation: "Verify with human review or additional sources"
- Progress bar (partial blue)
- Status badge: "⚠️ Review"

**Low Confidence (<60%) ❌**
- Count: 1 result
- Percentage: 2.2%
- Recommendation: "Requires manual review or knowledge base expansion"
- Progress bar (small yellow)
- Status badge: "❌ Verify"

#### Processing Performance Metrics ⚙️
Four metric cards:
- **Total Processed:** 45 questions
- **Avg Processing:** 412ms
- **Fastest:** 285ms
- **Slowest:** 680ms

#### AI Recommendations 💡
Action items based on system performance:

**Green (✅) Recommendations:**
- "RAG system is performing excellently"
- "No medium-confidence results"
- "Low-confidence results are minimal"

**Yellow (⚠️) Recommendations:**
- "Consider expanding knowledge base"
- "Review medium-confidence results"
- "Improve query expansion"

**Red (❌) Recommendations:**
- "Knowledge base needs significant expansion"
- "High number of low-confidence results"
- "Requires additional document uploads"

#### How to Use Confidence Scores 📖
**Usage Guide Section:**
```
High Confidence (80%+): Use directly
- These answers are highly confident
- Minimal manual review needed

Medium Confidence (60-80%): Verify first
- Cross-reference with additional sources
- Human review recommended

Low Confidence (<60%): Research needed
- Knowledge base may be incomplete
- Additional uploads recommended
```

---

## Integration in Projects Page

### Tab Structure
```
Projects Page
├── Questions Tab (original)
├── Knowledge Base Tab (original)
├── RAG Insights Tab ← NEW (RAGDashboard)
├── Confidence Tab ← NEW (ConfidenceRecommender)
└── Architecture Tab (original)
```

### Accessing RAG Components

**RAG Insights Tab:**
1. Select a project
2. Click "RAG Insights" tab
3. Choose view mode: Overview, Detailed, or Timeline
4. Analyze RAG processing in real-time

**Confidence Tab:**
1. Select a project
2. Click "Confidence" tab
3. View overall health score
4. Filter by confidence level
5. Read AI recommendations

---

## Example Workflows

### Workflow 1: Reviewing Low-Confidence Questions
```
1. Open Projects → Select project
2. Go to Confidence tab
3. See "Overall Health: 72%"
4. See "3 Low-confidence results (6.7%)"
5. Recommendation: "Review low-confidence results"
6. Click filter "Low (<60%)"
7. Identify which 3 questions need rework
8. Go to Knowledge Base tab
9. Add more relevant documents
```

### Workflow 2: Analyzing Why a Question Has Low Confidence
```
1. Open Projects → Select project
2. Go to RAG Insights tab
3. Switch to "Detailed" mode
4. Select the low-confidence question
5. View:
   - Original question text
   - Retrieved chunks (see which ones were found)
   - Similarity scores (77%, 52%, 13%)
   - Processing steps (see where it failed)
   - Confidence breakdown (which factor is lowest)
6. Understand: Knowledge base might not have better matches
7. Action: Upload more related documents
```

### Workflow 3: Monitoring System Performance Over Time
```
1. Open Projects → Select project
2. Go to RAG Insights tab
3. Switch to "Timeline" mode
4. Watch confidence distribution change
5. As more questions are processed:
   - See timeline grow
   - Watch confidence distribution shift
   - Monitor if system is improving
6. Use this to track improvement after Knowledge Base updates
```

---

## Data Updates

### Auto-Refresh
Both components fetch data on mount and when projectId changes.

```typescript
// Fetches from these endpoints:
GET /projects/:projectId/rag/stats
GET /projects/:projectId/rag/history
GET /projects/:projectId/rag/summary
GET /projects/:projectId/rag/confidence-threshold
```

### Manual Refresh
- "Refresh" button on RAGDashboard
- Components auto-update when new questions are processed

### Performance
- RAGDashboard: Usually <500ms load time
- ConfidenceRecommender: Usually <300ms load time
- Real-time updates as new questions are processed

---

## Visual Design

### Colors
```
High Confidence: Emerald (green)
  - RGB: 16, 185, 129
  - Hex: #10B981

Medium Confidence: Blue
  - RGB: 59, 130, 246
  - Hex: #3B82F6

Low Confidence: Yellow
  - RGB: 234, 179, 8
  - Hex: #EAB308

Primary: System primary color
Background: Card with subtle gradient
```

### Animations
- Smooth fade-ins for tabs
- Progress bar animations (0 → final value over 0.6s)
- Staggered card animation (each 0.1s delay)
- Hover effects on interactive elements

### Responsive Design
- Full width on desktop
- Stacked layout on tablet
- Single column on mobile
- Touch-friendly buttons

---

## Troubleshooting

### No Data Showing
- Verify backend is running (port 3000)
- Check that project has processed questions
- Check browser console for errors
- Verify network tab shows successful requests

### Slow Loading
- Backend might be processing
- Check network tab for request timing
- Refresh page to retry
- Check backend logs for errors

### Confidence Scores Not Updating
- Auto-refresh happens every component mount
- Click refresh button in RAGDashboard
- Process new questions to see updates
- Check that questions are reaching backend

### Missing Chunks
- Knowledge base might be empty
- Upload documents via Knowledge Base tab
- Wait for processing to complete
- Try processing questions again

---

## Integration Points

### Frontend → Backend
```typescript
// RAGDashboard components call:
GET /projects/:projectId/rag/stats
GET /projects/:projectId/rag/history
POST /projects/:projectId/rag/process-question
GET /projects/:projectId/rag/all-data

// ConfidenceRecommender components call:
GET /projects/:projectId/rag/summary
GET /projects/:projectId/rag/confidence-threshold
```

### Backend Services
```typescript
// RAGService provides:
processQuestionRAG()           // Process through pipeline
calculateConfidenceScore()     // Calculate confidence
getRAGStats()                  // Get statistics
getProcessingHistory()         // Get history
getRAGDataForQuestion()        // Get specific question data
```

---

## Component Props

### RAGDashboard
```typescript
interface RAGDashboardProps {
  projectId: number;  // Required: Project ID to fetch data for
}
```

### ConfidenceRecommender
```typescript
interface ConfidenceRecommenderProps {
  projectId: number;  // Required: Project ID to fetch data for
}
```

Both components handle loading and error states internally.

---

## Extending the Components

### To Add New Metrics
1. Update RAGService to calculate metric
2. Update response DTO
3. Add display in component
4. Add to visualization

### To Add New Filters
1. Add filter button to component
2. Add filtering logic
3. Update displayed results
4. Update counts

### To Add New Views
1. Create new Tab section
2. Add TabsTrigger
3. Implement TabsContent
4. Fetch required data

---

## Summary

The RAG frontend components provide:
- **RAGDashboard:** Deep dive into RAG pipeline and processing
- **ConfidenceRecommender:** Confidence-based filtering and recommendations

Together they enable users to:
1. Understand how RAG works
2. See exactly what was retrieved
3. Know how confident each answer is
4. Get actionable recommendations
5. Improve system performance over time
