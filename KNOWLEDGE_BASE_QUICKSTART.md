# Knowledge Base Manager - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Backend running on http://localhost:3000
- Frontend running on http://localhost:8080
- At least one project created
- Knowledge base document uploaded

### Access the Knowledge Base Manager

1. **Navigate to Projects Page**
   - Go to http://localhost:8080
   - Click on a project to open it
   - You should see the project details page

2. **Go to Knowledge Base Tab**
   - Look for the tabs at the top: "Questions", "Knowledge Base", "Architecture"
   - Click on **"Knowledge Base"** tab

3. **You'll see two sections:**
   - **Top**: "Knowledge Hub" - File upload interface
   - **Bottom**: "Processed Knowledge Base" - KnowledgeBaseManager with all views

---

## 📊 Using the Views

### View Mode Controls
At the top right of the "Processed Knowledge Base" section, you'll find 4 buttons:

| Button | Icon | Purpose |
|--------|------|---------|
| **Overview** | 🔲 | See summary statistics |
| **Chunks** | 📋 | Browse chunks with sorting |
| **Embeddings** | 👁️ | Analyze vector embeddings |
| **Editor** | ⋮ | Edit/delete chunks |

---

## 🔍 VIEW 1: Overview

Shows high-level statistics and chunk summaries.

**What you'll see:**
- 4 stat cards at the top:
  - Total Chunks
  - Files Processed
  - Total Characters
  - Average Chunk Size

- By Source breakdown:
  - File name and chunk count
  - Total characters in file
  - Preview of first 3 chunks

**Actions:**
- Click "Expand All" / "Collapse All" to show/hide full chunk content
- Click on individual chunks to expand them

---

## 📋 VIEW 2: Chunks

Browse and filter chunks with sorting options.

**Sorting Options (Dropdown):**
- Sort by Index (default) - organized by source, then chunk number
- Sort by Source - grouped by filename
- Sort by Size - from smallest to largest

**Filtering (Dropdown):**
- All Sources (default)
- Or filter by specific source file

**What you'll see:**
- Chunks organized by file
- Each chunk shows:
  - Chunk index number
  - Character count
  - Text preview

**Actions:**
- Click on a chunk to select it (highlighted in blue)
- Use sorting/filtering to find specific chunks

---

## 📊 VIEW 3: Embeddings

Analyze vector embeddings and similarity metrics.

**Top Section - Select Chunk:**
- Click on any chunk thumbnail to select it
- Shows chunk filename and index

**Main Section - Embedding Details:**

| Card | Shows |
|------|-------|
| Vector Dimension | 1024 (Pinecone index size) |
| Non-Zero Values | How many dimensions have data |
| Vector Magnitude | Length of the vector ||Avg Value | Average embedding value |

**Visualizations:**

- **Value Range Distribution** - Histogram showing spread of values
- **Sparsity** - Percentage of active dimensions
- **Vector Properties:**
  - Type: Dense (Gemini embeddings)
  - Format: Float32
  - Normalization: L2-Normalized
  - Distance Metric: Cosine Similarity

- **Similarity to Other Chunks** - Shows similarity scores (0-1):
  - 1.0 = identical
  - 0.5 = similar
  - 0.0 = different

---

## ✏️ VIEW 4: Editor

Edit or delete individual chunks.

### Edit a Chunk:
1. Click the **✏️ Edit** button on any chunk
2. A textarea appears with the chunk content
3. Modify the text as needed
4. Click **Save Changes** button
   - Shows "Saving..." while processing
   - Updates immediately
5. Or click **Cancel** to discard changes

### Delete a Chunk:
1. Click the **🗑️ Delete** button on any chunk
2. Confirmation dialog appears:
   - "Are you sure? This action cannot be undone."
   - Click **Cancel** to abort
   - Click **Delete Chunk** to confirm
3. Chunk is removed from database and display

### Chunk Metadata:
Each chunk shows:
- 📊 Size in characters
- 🔗 Pinecone Vector ID (first 30 chars)
- 📅 Creation timestamp

---

## 🔄 Refresh Data

At the top of the "Processed Knowledge Base", there's a **refresh button** (🔄):
- Clears current data
- Reloads chunks from backend
- Useful after uploading new files

---

## 📤 Upload New Files

To add more documents to the knowledge base:

1. In the **Knowledge Hub** section (top):
   - See "File upload" area
   - Drag & drop or click to select .txt files
2. File will be:
   - Chunked automatically
   - Embedded using Gemini API
   - Stored in Pinecone + PostgreSQL
3. After upload, new chunks appear in the KnowledgeBaseManager

---

## 💡 Workflow Examples

### Example 1: Review and Edit a Document
1. Go to **Overview** tab
2. Look at the chunk summary
3. Click "Expand All" if needed
4. Switch to **Editor** tab
5. Find and edit any problematic chunks
6. Click Save

### Example 2: Find Smaller Chunks
1. Go to **Chunks** tab
2. Select "Sort by Size" from dropdown
3. Review smallest chunks
4. Edit or delete as needed

### Example 3: Analyze Embedding Quality
1. Go to **Embeddings** tab  
2. Click on different chunks
3. Compare:
   - Sparsity percentages
   - Similarity scores
   - Vector characteristics
4. Check if embeddings are capturing meaning

---

## ⚠️  Troubleshooting

### Chunks not loading?
- ❌ Check backend is running on port 3000
- ❌ Try clicking the refresh button (🔄)
- ❌ Check browser console for errors

### Edit/Delete buttons don't work?
- ❌ Make sure you're in the **Editor** tab
- ❌ Check backend is responding (try refresh)
- ❌ Look for error messages in red


### Embeddings not showing?
- ❌ Switch to Overview tab first
- ❌ Then go to Embeddings tab
- ❌ Make sure chunks were uploaded (not just created)

---

## 📊 Statistics Explained

### Total Chunks
Count of all text segments created from uploaded documents.

### Files Processed
Number of source files uploaded to the knowledge base.

### Total Characters
Sum of all characters across all chunks.

### Average Chunk Size
Total characters ÷ Total chunks.

### Sparsity (in Embeddings view)
Percentage of the 1024-dimensional vector that contains actual values (non-zero).
- High sparsity (70-90%) = dense representation
- Low sparsity (10-30%) = sparse representation

### Vector Magnitude
The length/norm of the embedding vector, always normalized to ~32 for L2-normalized embeddings.

---

## 🎯 Best Practices

1. **Before Editing:**
   - Review chunk content in Overview first
   - Check embedding similarity to verify quality
   - Consider impact on RAG retrieval

2. **When Deleting:**
   - Double-check the chunk content
   - Remember deletion is permanent
   - Consider impact on knowledge base completeness

3. **For Quality Assurance:**
   - Use Embeddings view to spot check quality
   - Compare similar chunks
   - Look for truncation or formatting issues

4. **Performance Tips:**
   - Use filters/sorting for large documents
   - Don't keep Editor view expanded for all chunks
   - Refresh periodically to clear browser memory

---

## 🔧 Component Refresh

Components auto-update when:
- ✅ Chunk is successfully updated
- ✅ Chunk is successfully deleted
- ✅ New file is uploaded
- ✅ You click the refresh button

---

## 📝 Common Tasks

### Task: Fix a malformed chunk
1. Go to Overview → find the chunk
2. Switch to Editor tab
3. Edit the content
4. Click Save Changes
5. Chunk updates immediately

### Task: Remove duplicate chunks
1. Go to Chunks tab
2. Sort by Size
3. Look for chunks with identical content
4. Delete duplicates
5. Verify in Overview

### Task: Analyze embedding quality
1. Go to Embeddings tab
2. Click through different chunks
3. Look at "Similarity to Other Chunks"
4. High similarity (>0.7) = related content ✅
5. Low similarity (<0.3) = unrelated ❌

### Task: Export chunk statistics
1. Note the stats shown in Overview:
   - Total chunks
   - Total files
   - Total characters
   - Average size
2. Screenshot or manually note
3. Use for reports/analysis

---

## 🎓 Learning Resources

See [KNOWLEDGE_BASE_MANAGER_DOCS.md](./KNOWLEDGE_BASE_MANAGER_DOCS.md) for:
- Component architecture details
- Backend API reference
- TypeScript type definitions
- Advanced features
- Development roadmap

---

## ✅ Feature Checklist

- [x] View all chunks organized by file
- [x] Filter chunks by source
- [x] Sort chunks (by index, source, or size)
- [x] View chunk statistics (counts, characters)
- [x] Expand/collapse chunk content
- [x] Edit chunk text inline
- [x] Delete chunks with confirmation
- [x] View embedding vector properties
- [x] Analyze chunk similarity
- [x] Responsive design (mobile to desktop)
- [x] Animations and transitions
- [x] Error handling and feedback

---

## 🚀 Next Steps

After mastering the Knowledge Base Manager:

1. **Test RAG Retrieval** - Upload questions and verify chunks are retrieved
2. **Integrate with Draft Agent** - See how chunks are used in answer generation
3. **Monitor Quality** - Track embedding quality and adjust as needed
4. **Optimize Chunks** - Edit chunks to improve retrieval performance

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review [KNOWLEDGE_BASE_MANAGER_DOCS.md](./KNOWLEDGE_BASE_MANAGER_DOCS.md)
3. Check browser console for errors
4. Verify backend is running

