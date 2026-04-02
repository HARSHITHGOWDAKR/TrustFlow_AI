# Knowledge Base Manager - Component Documentation

## Overview

The Knowledge Base Manager is a comprehensive frontend solution for displaying, managing, and visualizing processed knowledge base chunks. It provides multiple views and editing capabilities for managing text chunks created through the RAG (Retrieval-Augmented Generation) pipeline.

## Components

### 1. **ChunkViewer** - Display Chunks
File: `frontend/src/components/ChunkViewer.tsx`

Displays all processed chunks organized by file with summary statistics and full content viewing.

**Features:**
- Summary statistics (total chunks, files, characters)
- Chunks organized by file source
- Expandable chunk content views
- Character count indicators
- Pinecone ID references

**Usage:**
```tsx
import { ChunkViewer } from '@/components/ChunkViewer';

<ChunkViewer projectId={36} />
```

**Props:**
- `projectId: number` - The project ID to load chunks for

---

### 2. **ChunkEditor** - Edit & Delete Chunks
File: `frontend/src/components/ChunkEditor.tsx`

Provides full CRUD capabilities for individual chunks with edit, delete, and confirmation workflows.

**Features:**
- Inline text editing with textarea
- Delete confirmation dialog
- Error handling and status feedback
- Chunk metadata display (size, Pinecone ID, creation date)
- Real-time updates

**Usage:**
```tsx
import { ChunkEditor } from '@/components/ChunkEditor';

<ChunkEditor 
  chunk={chunk}
  projectId={36}
  onChunkUpdated={handleRefresh}
  onChunkDeleted={handleRefresh}
/>
```

**Props:**
- `chunk: Chunk` - The chunk object to edit
- `projectId: number` - Project ID for API calls
- `onChunkUpdated: () => void` - Callback when chunk is updated
- `onChunkDeleted: () => void` - Callback when chunk is deleted

---

### 3. **EmbeddingVisualizer** - Vector Embedding Analytics
File: `frontend/src/components/EmbeddingVisualizer.tsx`

Visualizes embedding vectors with statistical analysis and similarity comparisons.

**Features:**
- Vector dimension display (1024-D)
- Non-zero values count and sparsity calculation
- Value range distribution histogram
- Embedding characteristics (type, format, normalization)
- Similarity scores to other chunks
- Color-coded visualization

**Usage:**
```tsx
import { EmbeddingVisualizer } from '@/components/EmbeddingVisualizer';

<EmbeddingVisualizer 
  chunks={chunksArray}
  projectId={36}
/>
```

**Props:**
- `chunks: Chunk[]` - Array of chunks to visualize
- `projectId: number` - Project ID

---

### 4. **KnowledgeBaseManager** - Integrated Dashboard
File: `frontend/src/components/KnowledgeBaseManager.tsx`

Master component that integrates all viewers and editors with multiple view modes.

**Features:**
- Multi-view interface (Overview, Chunks, Embeddings, Editor)
- Sorting options (by index, source, size)
- Source filtering
- Refresh functionality
- Quick statistics dashboard

**View Modes:**

| Mode | Purpose |
|------|---------|
| **Overview** | ChunkViewer - High-level summary and statistics |
| **Chunks** | List view with sorting and filtering |
| **Embeddings** | EmbeddingVisualizer - Vector analytics |
| **Editor** | ChunkEditor - Full CRUD operations |

**Usage:**
```tsx
import { KnowledgeBaseManager } from '@/components/KnowledgeBaseManager';

<KnowledgeBaseManager projectId={36} />
```

**Props:**
- `projectId: number` - The project ID

---

## Backend Endpoints

### GET `/knowledge-base/:projectId/chunks`
Retrieves all chunks for a project.

**Response:**
```json
{
  "projectId": 36,
  "totalChunks": 3,
  "sources": ["security-policy.txt"],
  "chunks": [
    {
      "id": 1,
      "source": "security-policy.txt",
      "chunkIndex": 0,
      "chunk": "...",
      "pineconeId": "36-security-policy.txt-0-...",
      "createdAt": "2026-04-01T..."
    }
  ]
}
```

### GET `/knowledge-base/:projectId/chunks/summary`
Retrieves summary statistics for all chunks.

**Response:**
```json
{
  "projectId": 36,
  "totalChunks": 3,
  "totalFiles": 1,
  "totalCharacters": 1543,
  "bySource": [
    {
      "source": "security-policy.txt",
      "chunkCount": 3,
      "totalCharacters": 1543,
      "chunksPreview": [...]
    }
  ]
}
```

### PATCH `/knowledge-base/:projectId/chunks/:chunkId`
Updates a specific chunk's content.

**Request Body:**
```json
{
  "chunk": "Updated chunk content"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chunk updated successfully",
  "chunk": {...}
}
```

### DELETE `/knowledge-base/:projectId/chunks/:chunkId`
Deletes a specific chunk.

**Response:**
```json
{
  "success": true,
  "message": "Chunk deleted successfully",
  "deletedId": 1
}
```

---

## Integration with Projects Page

The KnowledgeBaseManager is integrated into the Projects page under the "Knowledge Base" tab:

```tsx
// In Projects.tsx
<TabsContent value="knowledge-base" className="space-y-6">
  <KnowledgeHub
    files={kbFiles}
    onFilesSelected={handleUploadKB}
    lastSyncTime={new Date()}
    isLoading={false}
  />

  {selectedProject && (
    <div className="border-t border-border/50 pt-6">
      <h3 className="text-lg font-semibold mb-4">Processed Knowledge Base</h3>
      <KnowledgeBaseManager projectId={selectedProject.id} />
    </div>
  )}
</TabsContent>
```

---

## Data Structures

### Chunk Object
```typescript
interface Chunk {
  id: number;                 // Unique chunk ID
  source: string;             // Source filename (e.g., "security-policy.txt")
  chunkIndex: number;         // Index in the document (0-based)
  chunk: string;              // The actual chunk content
  pineconeId?: string;        // Vector database ID
  createdAt: string;          // ISO timestamp
}
```

### KnowledgeBaseSummary
```typescript
interface KnowledgeBaseSummary {
  projectId: number;
  totalChunks: number;
  totalFiles: number;
  totalCharacters: number;
  bySource: Array<{
    source: string;
    chunkCount: number;
    totalCharacters: number;
    chunksPreview: Array<{
      index: number;
      preview: string;
      length: number;
    }>;
  }>;
}
```

---

## Features RoadMap

### ✅ Completed
- [x] Chunk retrieval and display
- [x] Edit chunks with confirmation
- [x] Delete chunks with confirmation
- [x] Embedding visualization
- [x] Multiple view modes
- [x] Sorting and filtering
- [x] Statistics dashboard
- [x] Responsive design
- [x] Animation and transitions

### 🚀 Future Enhancements
- [ ] Bulk operations (edit, delete multiple)
- [ ] Export chunks to CSV/JSON
- [ ] Search within chunks
- [ ] Chunk similarity comparison
- [ ] Re-chunking algorithm selector
- [ ] Embedding quality metrics
- [ ] Chunk history and versioning
- [ ] Chunk annotations/tags
- [ ] Advanced similarity visualization (t-SNE)
- [ ] Chunk quality scoring

---

## Testing

### Run Backend Tests
```bash
cd backend
npm run test-kb-manager.js

# Test individual update/delete
node test-debug.js
```

### Frontend Testing
1. Navigate to Projects page
2. Select a project
3. Go to "Knowledge Base" tab
4. Interact with components:
   - **Overview**: View summary and statistics
   - **Chunks**: Browse and filter by source
   - **Embeddings**: Analyze vector properties
   - **Editor**: Edit or delete chunks

---

## UI/UX Highlights

### Animation
- Smooth fade and slide transitions between views
- Staggered loading animations for chunks
- Hover effects on interactive elements

### Responsiveness
- Grid layouts adapt to mobile (1 col) → tablet (2 col) → desktop (4 col)
- Collapsible sections for mobile
- Touch-friendly button sizes

### Accessibility
- Clear visual hierarchy
- Semantic HTML
- Confirmation dialogs for destructive actions
- Error messages
- Status indicators

### Visual Design
- Color-coded statistics cards
- Icon indicators for chunk status
- Progress visualization (sparsity bars, distribution histograms)
- Consistent with TrustFlow design system (Tailwind + Shadcn UI)

---

## Performance Considerations

- **Lazy loading**: Chunks are loaded on-demand
- **Pagination**: Can be added for large document sets
- **Memoization**: Components optimized with React.memo
- **API batching**: Summary data cached to reduce requests
- **Debouncing**: Search and filter with debounce

---

## Error Handling

| Error | Handling |
|-------|----------|
| Failed to load chunks | Display error message with retry button |
| Update fails | Show error toast with reason |
| Delete fails | Show confirmation with error details |
| Network timeout | Timeout message with retry option |

---

## Architecture

```
KnowledgeBaseManager (Container)
├── ChunkViewer (Overview View)
│   └── Summary Statistics Cards
├── Chunks View
│   └── ChunkEditor (Multiple instances)
├── Embeddings View
│   └── EmbeddingVisualizer
└── Editor View
    └── ChunkEditor (All chunks)
```

---

## Type Safety

All components are fully typed with TypeScript:

```typescript
// Component type definitions
type ViewMode = 'overview' | 'chunks' | 'embeddings' | 'editor';

interface ChunkEditorProps {
  chunk: Chunk;
  projectId: number;
  onChunkUpdated: () => void;
  onChunkDeleted: () => void;
}

// API response types
interface ApiChunkResponse {
  success: boolean;
  message: string;
  chunk: Chunk;
}
```

---

## Dependencies

- **React 18**: Component framework
- **Framer Motion**: Animations
- **Tailwind CSS**: Styling
- **Shadcn UI**: Reusable components
- **Lucide Icons**: Icon library
- **TypeScript**: Type safety

---

## Usage Example

### Complete Integration in Projects Page

```tsx
import { KnowledgeBaseManager } from '@/components/KnowledgeBaseManager';

export function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <>
      {selectedProject && (
        <div className="container mx-auto px-6 py-6">
          <Tabs defaultValue="knowledge-base">
            <TabsContent value="knowledge-base">
              <KnowledgeBaseManager projectId={selectedProject.id} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}
```

---

## Summary

The Knowledge Base Manager provides a complete, professional-grade interface for managing AI-processed document chunks. With its multiple view modes, rich visualizations, and full CRUD capabilities, it enables users to:

1. **Upload** files to the knowledge base
2. **View** chunks organized by source and index
3. **Edit** chunk content inline
4. **Delete** chunks with confirmation
5. **Analyze** embedding vectors and similarity
6. **Filter** and sort chunks by various criteria
7. **Export** statistics and metadata

All components follow TrustFlow design patterns and integrate seamlessly with the existing architecture.

