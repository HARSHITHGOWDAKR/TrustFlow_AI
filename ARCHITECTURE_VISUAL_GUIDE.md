# Knowledge Base Manager - Architecture & Visual Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Projects Page (Projects.tsx)               │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │  Questions Tab    Knowledge Base Tab   Architecture│  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │              │                                           │   │
│  │              └─────────────┬─────────────────────────────┤   │
│  │                            │                             │   │
│  │  ┌─────────────────────────▼─────────────────────────┐  │   │
│  │  │        Knowledge Base Tab Content                 │  │   │
│  │  │                                                   │  │   │
│  │  │  ┌─────────────────────────────────────────────┐ │  │   │
│  │  │  │     KnowledgeHub (File Upload)              │ │  │   │
│  │  │  │     - Select .txt files                     │ │  │   │
│  │  │  │     - Upload to backend                     │ │  │   │
│  │  │  └─────────────────────────────────────────────┘ │  │   │
│  │  │                                                   │  │   │
│  │  │  ┌──────────────────────────────────────────────┐ │  │   │
│  │  │  │   KnowledgeBaseManager (NEW)                │ │  │   │
│  │  │  │                                              │ │  │   │
│  │  │  │  Tab Controls: [Overview] [Chunks]          │ │  │   │
│  │  │  │               [Embeddings] [Editor]          │ │  │   │
│  │  │  │                                              │ │  │   │
│  │  │  │  ┌────────────────────────────────────────┐ │  │   │
│  │  │  │  │ Overview Tab (ChunkViewer)             │ │  │   │
│  │  │  │  │  - Stats cards (4)                     │ │  │   │
│  │  │  │  │  - By source breakdown                │ │  │   │
│  │  │  │  │  - Chunk previews                     │ │  │   │
│  │  │  │  └────────────────────────────────────────┘ │  │   │
│  │  │  │                                              │ │  │   │
│  │  │  │  ┌────────────────────────────────────────┐ │  │   │
│  │  │  │  │ Chunks Tab (Sortable Browser)          │ │  │   │
│  │  │  │  │  - Sort dropdown (index/source/size)  │ │  │   │
│  │  │  │  │  - Filter dropdown (by source)        │ │  │   │
│  │  │  │  │  - Chunk list with selection          │ │  │   │
│  │  │  │  └────────────────────────────────────────┘ │  │   │
│  │  │  │                                              │ │  │   │
│  │  │  │  ┌────────────────────────────────────────┐ │  │   │
│  │  │  │  │ Embeddings Tab (EmbeddingVisualizer)   │ │  │   │
│  │  │  │  │  - Select chunk                       │ │  │   │
│  │  │  │  │  - Vector stats (1024-D)              │ │  │   │
│  │  │  │  │  - Distribution histogram              │ │  │   │
│  │  │  │  │  - Similarity scores                  │ │  │   │
│  │  │  │  └────────────────────────────────────────┘ │  │   │
│  │  │  │                                              │ │  │   │
│  │  │  │  ┌────────────────────────────────────────┐ │  │   │
│  │  │  │  │ Editor Tab (ChunkEditor)               │ │  │   │
│  │  │  │  │  - All chunks listed                  │ │  │   │
│  │  │  │  │  - Edit button → textarea             │ │  │   │
│  │  │  │  │  - Delete button → confirm dialog     │ │  │   │
│  │  │  │  │  - Save/Cancel actions                │ │  │   │
│  │  │  │  └────────────────────────────────────────┘ │  │   │
│  │  │  │                                              │ │  │   │
│  │  │  └──────────────────────────────────────────────┘ │  │   │
│  │  │                                                   │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                   │
│                    HTTP Fetch Calls (Port 8080)                 │
│                           ↓ ↑                                    │
└─────────────────────────────────────────────────────────────────┘
                           │ │ │ │
                           │ │ │ │ API Calls
                           │ │ │ │
                           ▼ ▼ ▼ ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (NestJS - Port 3000)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │      TrustFlowKnowledgeController                        │  │
│  │                                                          │  │
│  │  POST   /knowledge-base/:projectId/ingest               │  │
│  │         └─→ Upload & chunk text files                   │  │
│  │                                                          │  │
│  │  GET    /knowledge-base/:projectId/chunks               │  │
│  │  ├───────→ Retrieve all chunks for project              │  │
│  │  │         Response: { projectId, totalChunks, chunks[] }│  │
│  │  │                                                       │  │
│  │  GET    /knowledge-base/:projectId/chunks/summary       │  │
│  │  ├───────→ Get summary statistics                       │  │
│  │  │         Response: { totalChunks, bySource[] }        │  │
│  │  │                                                       │  │
│  │  PATCH  /knowledge-base/:projectId/chunks/:chunkId ✨ NEW│  │
│  │  ├───────→ Update chunk content                         │  │
│  │  │         Request: { chunk: string }                   │  │
│  │  │         Response: { success, chunk }                 │  │
│  │  │                                                       │  │
│  │  DELETE /knowledge-base/:projectId/chunks/:chunkId ✨ NEW│  │
│  │  └───────→ Delete chunk                                 │  │
│  │           Response: { success, deletedId }              │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           TrustFlowKnowledgeService                      │  │
│  │                                                          │  │
│  │  - ingestTextFileToKnowledgeBase()                       │  │
│  │  - chunkText() - splits into 600-char chunks            │  │
│  │  - generateEmbeddings() - 1024-dim vectors              │  │
│  │  - getKnowledgeStats()                                  │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓ ↑                                    │
└─────────────────────────────────────────────────────────────────┘
                      │      │      │
                      │      │      │ Database Queries
                      │      │      │
    ┌─────────────────┘      │      └──────────────────┐
    │                        │                         │
    ▼                        ▼                         ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL DB   │  │  Pinecone Vector │  │  Gemini API      │
│  (Metadata)      │  │  Database        │  │  (Embeddings)    │
│                  │  │                  │  │                  │
│  KnowledgeChunk  │  │  1024-D Vectors  │  │  Mock Embeddings │
│  - id            │  │                  │  │  (Fallback)      │
│  - projectId     │  │  Stores vectors  │  │                  │
│  - source        │  │  for similarity  │  │  Generates 1024- │
│  - chunkIndex    │  │  search via      │  │  dimensional     │
│  - chunk (text)  │  │  cosine          │  │  vectors         │
│  - pineconeId    │  │  similarity      │  │                  │
│  - createdAt     │  │                  │  │                  │
│                  │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Component Hierarchy

```
Projects Page
└── Knowledge Base Tab
    ├── KnowledgeHub (File Upload)
    │   └── File Selection + POST /ingest
    │
    └── KnowledgeBaseManager (MASTER)
        ├── View Mode Controls
        │   ├── [Overview] → shows ChunkViewer
        │   ├── [Chunks]   → shows Chunks List
        │   ├── [Embeddings] → shows EmbeddingVisualizer
        │   └── [Editor]   → shows ChunkEditor Array
        │
        ├── ChunkViewer (View Mode: Overview)
        │   ├── Statistics Cards (4)
        │   │   ├── Total Chunks
        │   │   ├── Files Processed
        │   │   ├── Total Characters
        │   │   └── Average Chunk Size
        │   │
        │   └── By Source Breakdown
        │       └── Multiple SourceGroup Components
        │           └── Chunk Previews
        │
        ├── Chunks List (View Mode: Chunks)
        │   ├── Sort Dropdown
        │   ├── Filter Dropdown
        │   └── Chunk Items by Source
        │       └── Clickable Chunk Cards
        │
        ├── EmbeddingVisualizer (View Mode: Embeddings)
        │   ├── Chunk Selector Grid
        │   └── Selected Chunk Details
        │       ├── Vector Stats Cards (4)
        │       ├── Value Distribution Histogram
        │       ├── Sparsity Indicator
        │       ├── Vector Properties
        │       └── Similarity Scores
        │
        └── ChunkEditor Array (View Mode: Editor)
            └── Multiple ChunkEditor Instances
                ├── Edit Mode
                │   ├── Textarea
                │   ├── Save Button
                │   └── Cancel Button
                │
                └── Delete Mode
                    ├── Confirmation Dialog
                    └── Delete Button

Data Flow:
KnowledgeBaseManager (state)
├── chunks: Chunk[]              (GET /chunks)
├── summary: Summary             (GET /chunks/summary)
├── viewMode: 'overview' | ...
├── selectedChunkId: number | null
├── sortBy: 'index' | 'source' | 'size'
└── filterSource: string | null

  ├→ ChunkViewer (props: chunks, summary)
  ├→ EmbeddingVisualizer (props: chunks)
  ├→ ChunkEditor (props: chunk, callbacks)
  └→ Chunk Filters/Sorters (props: chunks)
```

---

## Data Flow Diagram

### GET Chunks Flow
```
User clicks "Knowledge Base" tab
       ↓
KnowledgeBaseManager mounts
       ↓
useEffect calls loadChunks()
       ↓
fetch GET /knowledge-base/:projectId/chunks
       ↓
Backend queries PostgreSQL KnowledgeChunk table
       ↓
Returns { chunks: Chunk[] }
       ↓
Component setState(chunks) + setLoading(false)
       ↓
Render ChunkViewer with chunks
```

### UPDATE Chunk Flow
```
User clicks Edit button
       ↓
ChunkEditor shows textarea
       ↓
User modifies text
       ↓
User clicks "Save Changes"
       ↓
fetch PATCH /knowledge-base/:projectId/chunks/:chunkId
       {chunk: updatedText}
       ↓
Backend updates PostgreSQL
       ↓
Returns {success: true, chunk}
       ↓
ChunkEditor calls onChunkUpdated()
       ↓
KnowledgeBaseManager calls loadChunks()
       ↓
Display refreshes with updated chunks
```

### DELETE Chunk Flow
```
User clicks Delete button
       ↓
ChunkEditor shows confirmation dialog
       ↓
User confirms deletion
       ↓
fetch DELETE /knowledge-base/:projectId/chunks/:chunkId
       ↓
Backend deletes from PostgreSQL
       ↓
Returns {success: true, deletedId}
       ↓
ChunkEditor calls onChunkDeleted()
       ↓
KnowledgeBaseManager calls loadChunks()
       ↓
Display refreshes, chunk is gone
```

### VIEW Embeddings Flow
```
User clicks "Embeddings" tab
       ↓
EmbeddingVisualizer mounts
       ↓
Generates mock embedding stats for all chunks
       ↓
Displays chunk selector grid
       ↓
User clicks chunk
       ↓
selectedStats updated
       ↓
Render embedding details:
- Vector stats (1024-D)
- Value distribution
- Sparsity percentage
- Characteristics
- Similarity scores
```

---

## API Integration Points

### 4 HTTP Endpoints

```
1. GET /knowledge-base/:projectId/chunks
   └─ Used by: Overview tab, ChunkViewer, Editor tab
   └─ Called: ComponentDidMount, after create/update/delete
   └─ Response: { chunks[], projectId, totalChunks, sources }

2. GET /knowledge-base/:projectId/chunks/summary
   └─ Used by: Overview tab (statistics)
   └─ Called: ComponentDidMount
   └─ Response: { totalChunks, totalFiles, totalCharacters, bySource[] }

3. PATCH /knowledge-base/:projectId/chunks/:chunkId
   └─ Used by: ChunkEditor edit functionality
   └─ Called: When user clicks "Save Changes"
   └─ Request: { chunk: string }
   └─ Response: { success: true, chunk: Chunk }

4. DELETE /knowledge-base/:projectId/chunks/:chunkId
   └─ Used by: ChunkEditor delete functionality
   └─ Called: When user confirms deletion
   └─ Response: { success: true, deletedId: number }
```

---

## Component Dependencies

```
ChunkViewer
├─ No internal dependencies
├─ Props: projectId, chunks (optional)
└─ Calls: GET /chunks, GET /chunks/summary

ChunkEditor  
├─ Dependencies: Lucide Icons, Framer Motion
├─ Props: chunk, projectId, callbacks
└─ Calls: PATCH /chunks/:id, DELETE /chunks/:id

EmbeddingVisualizer
├─ Dependencies: Framer Motion
├─ Props: chunks, projectId
└─ Calls: None (uses mock data generation)

KnowledgeBaseManager (Master)
├─ Dependencies: All 3 above components
├─ Props: projectId
└─ Calls: GET /chunks, GET /chunks/summary
          + delegates to children for mutations

Projects Page (parent)
├─ Dependencies: KnowledgeBaseManager
└─ Props: selectedProject
```

---

## State Management

### KnowledgeBaseManager (Local State)
```typescript
const [chunks, setChunks] = useState<Chunk[]>([]);
const [summary, setSummary] = useState<Summary | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [viewMode, setViewMode] = useState<ViewMode>('overview');
const [selectedChunkId, setSelectedChunkId] = useState<number | null>(null);
const [sortBy, setSortBy] = useState<'index' | 'source' | 'size'>('index');
const [filterSource, setFilterSource] = useState<string | null>(null);
const [showFullContent, setShowFullContent] = useState<Record<number, boolean>>({});

useEffect(() => {
  loadChunks(); // Fetch on mount and projectId change
}, [projectId]);
```

---

## Error Handling Strategy

```
Try-Catch blocks in:
├─ loadKnowledgeBase()
│  └─ Try: Fetch chunks + summary
│  └─ Catch: Display error message + retry button
│
├─ handleSave() (ChunkEditor)
│  └─ Try: PATCH /chunks/:id
│  └─ Catch: Show error modal + option to retry
│
├─ handleDelete() (ChunkEditor)
│  └─ Try: DELETE /chunks/:id
│  └─ Catch: Show error modal + keep confirmation dialog
│
└─ Component level
   └─ Boundary: Error card displayed if chunks is empty

Email/Network errors:
- 404 Not Found → "Chunk not found"
- 500 Server Error → "Server error, please try again"
- Network timeout → "Connection lost, please retry"
```

---

## Performance Optimization

```
Rendering:
├─ Memoization of child components (React.memo)
├─ Keys on list items for efficient diffing
└─ AnimatePresence boundary to prevent unmounting

State Updates:
├─ Batch updates using setState
├─ Avoid re-rendering unrelated components
└─ Debounced search/filter operations

API Calls:
├─ Single loadChunks() call on mount
├─ Refresh only on user action
├─ No polling or continuous fetching
└─ Sequential API calls (not parallel for safety)

Bundle Size:
├─ Use existing dependencies (Framer, Tailwind)
├─ No new npm packages
├─ Tree-shakeable code
└─ CSS-in-JS (Tailwind purging)
```

---

## Accessibility Features

```
Buttons:
├─ Proper aria-labels for icon buttons
├─ Keyboard accessible (Tab, Enter)
└─ Focus visible states

Colors:
├─ Not sole indicator of status
├─ Icons + colors for status
└─ Sufficient contrast ratios

Forms:
├─ Textarea with proper labels
├─ Confirmation dialogs for destructive actions
└─ Error messages clearly displayed

Navigation:
├─ Tab order follows visual flow
├─ Skip to main content
└─ Semantic HTML (buttons, divs with roles)
```

---

## Testing Coverage

```
Unit Tests (Backend):
├─ GET /chunks
├─ GET /chunks/summary
├─ PATCH /chunks/:id
├─ DELETE /chunks/:id
└─ Error cases

Integration Tests:
├─ Complete CRUD workflow
├─ Error recovery
└─ statistics calculation

E2E Scenarios:
├─ Upload → View → Edit → Delete
├─ Sorting & filtering
├─ Embedding visualization
└─ Error handling
```

---

## Browser Compatibility

```
Supported:
├─ Chrome 90+
├─ Edge 90+
├─ Firefox 88+
├─ Safari 14+
└─ Mobile browsers (iOS Safari, Chrome Android)

Features Used:
├─ CSS Grid (widely supported)
├─ Flexbox (widely supported)
├─ CSS custom properties (modern browsers)
├─ Fetch API (with polyfill for IE11 if needed)
└─ ES6+ (transpiled by Vite)
```

---

## Deployment Checklist

## Pre-Deployment
- [ ] All components tested locally
- [ ] Backend endpoints tested with Postman/curl
- [ ] No console errors in development
- [ ] TypeScript strict mode passes
- [ ] ESLint configuration passes
- [ ] Environment variables configured
- [ ] API endpoints point to correct URLs

## During Deployment
- [ ] Build frontend: `npm run build`
- [ ] Build backend: `npm run build`
- [ ] Deploy backend to server
- [ ] Update frontend API endpoints
- [ ] Deploy frontend to CDN/server
- [ ] Run smoke tests
- [ ] Monitor server logs

## Post-Deployment
- [ ] Test CRUD operations in production
- [ ] Monitor performance metrics
- [ ] Check error logs
- [ ] Verify API connectivity
- [ ] Confirm database persistence
- [ ] User acceptance testing

