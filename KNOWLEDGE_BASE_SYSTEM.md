# Knowledge Base Management System

## Overview

The Knowledge Base Management System allows companies to store, organize, and manage their policies directly in the database. This enables the RAG (Retrieval-Augmented Generation) system to reference authoritative company policies when answering questions.

---

## 📋 Features

### 1. **Add Policies Directly to Database**
- Upload company policies with title, content, category, and tags
- Source tracking (FILE, MANUAL, or API)
- Automatic timestamps and tracking

### 2. **Organize by Category**
- Categorize policies (e.g., GDPR, Security, HR, Finance)
- Filter and search by category
- Display all available categories

### 3. **Tag-Based Organization**
- Add multiple tags to each policy
- Search policies by tags
- Better discoverability

### 4. **Full-Text Search**
- Search policies by keyword
- Searches title, content, and tags
- Real-time search results

### 5. **Policy Management**
- View full policy content
- Edit existing policies
- Delete policies (soft delete)
- Track upload dates and modifications

### 6. **Chunking for RAG**
- Policies automatically chunked for RAG retrieval
- Embed chunks for vector search
- Support for large policy documents

### 7. **Statistics & Analytics**
- Track total policies
- Monitor chunks created
- View category breakdown
- Export all policies for backup

---

## 🏗️ Architecture

### Backend Structure

**Module: `KnowledgeBaseModule`**
- Location: `backend/src/knowledge-base/`
- Files:
  - `knowledge-base.module.ts` - Module definition
  - `knowledge-base.service.ts` - Business logic
  - `knowledge-base.controller.ts` - REST API endpoints
  - `knowledge-base.interface.ts` - TypeScript interfaces

**Database Models:**

```prisma
model KnowledgeBasePolicy {
  id          String                    // Unique ID (CUID)
  projectId   Int                       // Foreign key to Project
  title       String                    // Policy title
  content     String                    // Full policy text
  category    String?                   // Category classification
  tags        String?                   // Comma-separated tags
  source      String                    // FILE | MANUAL | API
  isActive    Boolean                   // Soft delete flag
  uploadedAt  DateTime                  // Creation timestamp
  updatedAt   DateTime                  // Last modification
  chunks      KnowledgeBaseChunk[]      // Relationship to chunks
}

model KnowledgeBaseChunk {
  id              String    // Unique ID (CUID)
  policyId        String    // Foreign key to policy
  content         String    // Chunk text segment
  embeddingVector String?   // Vector embeddings (JSON)
  order           Int       // Position in policy
  sourceRef       String?   // Page/section reference
  createdAt       DateTime  // Creation timestamp
}
```

---

## 🔌 API Endpoints

### Add a Policy
```
POST /knowledge-base/projects/:projectId/policies

Request Body:
{
  "title": "Data Retention Policy",
  "content": "Our company retains customer data for 7 years...",
  "category": "Data Protection",
  "tags": ["GDPR", "privacy", "compliance"],
  "source": "MANUAL"
}

Response:
{
  "success": true,
  "policyId": "abc123def456",
  "message": "Policy 'Data Retention Policy' added successfully",
  "policy": { ... }
}
```

### Get All Policies for Project
```
GET /knowledge-base/projects/:projectId/policies

Response:
{
  "success": true,
  "count": 5,
  "policies": [
    {
      "id": "abc123def456",
      "title": "Data Retention Policy",
      "category": "Data Protection",
      "tags": ["GDPR", "privacy"],
      "uploadedAt": "2026-04-02T10:30:00Z",
      ...
    }
  ]
}
```

### Get Specific Policy
```
GET /knowledge-base/policies/:policyId

Response:
{
  "success": true,
  "policy": {
    "id": "abc123def456",
    "title": "Data Retention Policy",
    "content": "...",
    "chunks": [ ... ]
  }
}
```

### Update Policy
```
PUT /knowledge-base/policies/:policyId

Request Body:
{
  "title": "Updated Title",
  "content": "Updated content...",
  "category": "New Category",
  "tags": ["tag1", "tag2"],
  "isActive": true
}

Response: Updated policy object
```

### Delete Policy (Soft Delete)
```
DELETE /knowledge-base/policies/:policyId

Response:
{
  "success": true,
  "message": "Policy deleted successfully"
}
```

### Search Policies
```
GET /knowledge-base/projects/:projectId/search?keyword=GDPR

Response:
{
  "success": true,
  "count": 3,
  "results": [ ... matching policies ... ]
}
```

### Get Policies by Category
```
GET /knowledge-base/projects/:projectId/categories/:category

Response:
{
  "success": true,
  "category": "Data Protection",
  "count": 4,
  "policies": [ ... ]
}
```

### Get All Categories
```
GET /knowledge-base/projects/:projectId/categories

Response:
{
  "success": true,
  "count": 5,
  "categories": ["Data Protection", "Security", "HR", "Finance", "Compliance"]
}
```

### Add Chunks to Policy
```
POST /knowledge-base/policies/:policyId/chunks

Request Body:
{
  "chunks": [
    {
      "content": "Section text...",
      "order": 1,
      "sourceRef": "Page 1"
    }
  ]
}
```

### Get Chunks by Policy
```
GET /knowledge-base/policies/:policyId/chunks

Response:
{
  "success": true,
  "count": 10,
  "chunks": [ ... ]
}
```

### Bulk Import Policies
```
POST /knowledge-base/projects/:projectId/bulk-import

Request Body:
{
  "policies": [
    { "title": "Policy 1", "content": "...", ... },
    { "title": "Policy 2", "content": "...", ... }
  ]
}
```

### Get Statistics
```
GET /knowledge-base/projects/:projectId/statistics

Response:
{
  "success": true,
  "statistics": {
    "totalPolicies": 5,
    "totalChunks": 42,
    "categories": 3,
    "categoryBreakdown": [
      { "category": "Data Protection", "count": 2 },
      { "category": "Security", "count": 2 },
      { "category": "HR", "count": 1 }
    ]
  }
}
```

### Export All Policies
```
GET /knowledge-base/projects/:projectId/export

Response:
{
  "success": true,
  "count": 5,
  "exportedAt": "2026-04-02T10:30:00Z",
  "policies": [ ... all policies with chunks ... ]
}
```

---

## 🖥️ Frontend Component

### KnowledgeBaseUpload Component

**Location:** `frontend/src/components/KnowledgeBaseUpload.tsx`

**Props:**
```typescript
interface KnowledgeBaseUploadProps {
  projectId: number;
  onPolicyAdded?: (policy: Policy) => void;
}
```

**Features:**
- Statistics dashboard (total policies, categories, chunks)
- Add new policy form
- Search policies by keyword
- Filter by category
- View, edit, delete policies
- View tags and metadata
- Loading states and error handling

**Usage:**
```typescript
import { KnowledgeBaseUpload } from '@/components/KnowledgeBaseUpload';

export function MyComponent() {
  return (
    <KnowledgeBaseUpload 
      projectId={42}
      onPolicyAdded={(policy) => console.log('Added:', policy)}
    />
  );
}
```

---

## 💾 Database Schema

### Migration File
**Location:** `backend/prisma/migrations/20260402_add_knowledge_base/migration.sql`

Creates two new tables:
1. **KnowledgeBasePolicy** - Main policy storage
2. **KnowledgeBaseChunk** - Chunked content for RAG

Indexes:
- `projectId` - Fast project lookups
- `category` - Fast category filtering
- `isActive` - Efficient soft delete queries
- `policyId` (in chunks) - Fast chunk lookups

---

## 🔄 Integration with RAG System

### How It Works

1. **Policy Upload**
   - User uploads policy via UI component
   - Policy saved to `KnowledgeBasePolicy` table
   - Title, content, category, tags stored

2. **Chunking**
   - Policy content split into chunks
   - Chunks stored in `KnowledgeBaseChunk` table
   - Each chunk has order and source reference

3. **Embedding**
   - Chunks embedded using Gemini API
   - Embeddings stored as JSON in `embeddingVector`
   - Vector stored in Pinecone for semantic search

4. **Retrieval**
   - When processing a question:
     - RAG system searches Pinecone
     - Retrieves relevant policy chunks
     - Uses chunks to augment LLM context
     - RAG generates answers using policy content

5. **Confidence Scoring**
   - Higher match scores when policies directly address question
   - Confidence increased when exact policy language used
   - Recommendations provided for ambiguous answers

---

## 📝 Usage Examples

### Example 1: Add a Data Protection Policy

**Request:**
```bash
curl -X POST http://localhost:3000/knowledge-base/projects/1/policies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Data Retention Policy",
    "content": "Our company retains customer data for seven years in compliance with GDPR...",
    "category": "Data Protection",
    "tags": ["GDPR", "privacy", "retention"],
    "source": "MANUAL"
  }'
```

**Response:**
```json
{
  "success": true,
  "policyId": "cuid_123_abc",
  "message": "Policy 'Data Retention Policy' added successfully",
  "policy": {
    "id": "cuid_123_abc",
    "projectId": 1,
    "title": "Data Retention Policy",
    "category": "Data Protection",
    "tags": "GDPR,privacy,retention",
    "source": "MANUAL",
    "isActive": true,
    "uploadedAt": "2026-04-02T10:30:00.000Z",
    "updatedAt": "2026-04-02T10:30:00.000Z"
  }
}
```

### Example 2: Search for Security Policies

**Request:**
```bash
curl http://localhost:3000/knowledge-base/projects/1/search?keyword=password
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "results": [
    {
      "id": "cuid_456_def",
      "title": "Password Security Policy",
      "category": "Security",
      "tags": "MFA,authentication,security",
      "content": "All employees must use strong passwords..."
    }
  ]
}
```

### Example 3: Get Statistics

**Request:**
```bash
curl http://localhost:3000/knowledge-base/projects/1/statistics
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalPolicies": 8,
    "totalChunks": 156,
    "categories": 4,
    "categoryBreakdown": [
      { "category": "Data Protection", "count": 3 },
      { "category": "Security", "count": 2 },
      { "category": "HR", "count": 2 },
      { "category": "Finance", "count": 1 }
    ]
  }
}
```

---

## 🛡️ Security Considerations

### Data Protection
- Policies stored in database (encrypted at rest in PostgreSQL)
- Soft delete (isActive flag) preserves audit trail
- Project-level isolation (policies scoped to projects)

### Access Control
- All endpoints require valid projectId
- Only policies for a specific project can be accessed
- No cross-project policy access

### Content Security
- Policy content stored as-is (no modification)
- All modifications tracked with timestamps
- Audit trail preserved with creation/modification dates

---

## 🔧 Maintenance

### Backup & Export
```bash
# Export all policies for a project
curl http://localhost:3000/knowledge-base/projects/1/export > policies_backup.json
```

### Bulk Import
```bash
# Import policies from backup
curl -X POST http://localhost:3000/knowledge-base/projects/1/bulk-import \
  -H "Content-Type: application/json" \
  -d @policies_backup.json
```

### Clean Up
- Delete inactive policies (soft deleted)
- Remove duplicate policies
- Archive outdated policies

---

## 📊 Performance Optimization

### Indexing
- Policies indexed by projectId, category, isActive
- Chunks indexed by policyId
- Efficient filtering and search

### Query Optimization
- Lazy load policy content
- Separate chunk queries
- Batch operations for bulk imports

### Caching
- Cache categories list
- Cache statistics
- Invalidate on updates

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Policy versioning system
- [ ] Approval workflows for new policies
- [ ] Policy change history tracking
- [ ] Comparison between versions

### Phase 3
- [ ] Automatic policy extraction from PDFs
- [ ] OCR support for scanned documents
- [ ] Policy expiration dates
- [ ] Automated compliance reminders

### Phase 4
- [ ] Integration with legal document repositories
- [ ] AI-powered policy summarization
- [ ] Automated policy impact analysis
- [ ] Policy recommendation engine

---

## 📞 Support & Troubleshooting

### Common Issues

**Q: Policy not appearing after upload?**
A: Check that the project ID is correct and the database migration has run

**Q: Search returning no results?**
A: Verify the keyword matches the policy content (case-insensitive search)

**Q: Chunking not working for large policies?**
A: Ensure embedding service (Gemini) is configured and API keys set

### Debug Commands

```bash
# Check if module is loaded
curl http://localhost:3000/knowledge-base/projects/1/statistics

# Verify database migration
npm run prisma:migrate:status

# Reset database
npm run prisma:reset
```

---

## 📚 Related Documentation

- [RAG System Architecture](./ARCHITECTURE.md)
- [Database Schema Guide](./DATABASE_GUIDE.md)
- [Backend Integration Report](./AWS_INTEGRATION_REPORT.md)

---

**Status:** ✅ Production Ready
**Last Updated:** April 2, 2026

