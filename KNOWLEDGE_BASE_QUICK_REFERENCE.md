# Knowledge Base - Quick Reference Guide

## 📋 Quick Links

| Resource | Location |
|----------|----------|
| Full System Docs | [KNOWLEDGE_BASE_SYSTEM.md](./KNOWLEDGE_BASE_SYSTEM.md) |
| Integration Guide | [KNOWLEDGE_BASE_INTEGRATION_GUIDE.md](./KNOWLEDGE_BASE_INTEGRATION_GUIDE.md) |
| Backend Module | `backend/src/knowledge-base/` |
| Frontend Component | `frontend/src/components/KnowledgeBaseUpload.tsx` |
| Database Schema | `backend/prisma/schema.prisma` |

---

## 🚀 Quick Start (5 Minutes)

### 1. Register Module
```typescript
// backend/src/app.module.ts
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';

@Module({
  imports: [
    // ...
    KnowledgeBaseModule,  // ← ADD THIS
  ],
})
export class AppModule {}
```

### 2. Run Migration
```bash
cd backend
npx prisma migrate deploy
```

### 3. Integrate Frontend
```typescript
// frontend/src/pages/Projects.tsx
import { KnowledgeBaseUpload } from '@/components/KnowledgeBaseUpload';

// Add to tabs:
<TabsContent value="knowledge-base">
  <KnowledgeBaseUpload projectId={selectedProject.id} />
</TabsContent>
```

### 4. Start Services
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev
```

### 5. Verify
- Open http://localhost:8081/projects
- Select project → Knowledge Base tab
- Add a test policy

---

## 📡 API Endpoints Cheat Sheet

### Add Policy
```bash
POST /knowledge-base/projects/:projectId/policies
{
  "title": "string",
  "content": "string",
  "category": "string?",
  "tags": ["string"],
  "source": "MANUAL|FILE|API"
}
```

### Get All Policies
```bash
GET /knowledge-base/projects/:projectId/policies
```

### Get One Policy
```bash
GET /knowledge-base/policies/:policyId
```

### Update Policy
```bash
PUT /knowledge-base/policies/:policyId
{
  "title": "string?",
  "content": "string?",
  "category": "string?",
  "tags": ["string"]?,
  "isActive": boolean?
}
```

### Delete Policy
```bash
DELETE /knowledge-base/policies/:policyId
```

### Search
```bash
GET /knowledge-base/projects/:projectId/search?keyword=TERM
```

### Filter by Category
```bash
GET /knowledge-base/projects/:projectId/categories/:category
```

### Get Categories
```bash
GET /knowledge-base/projects/:projectId/categories
```

### Get Statistics
```bash
GET /knowledge-base/projects/:projectId/statistics
```

### Export All
```bash
GET /knowledge-base/projects/:projectId/export
```

### Bulk Import
```bash
POST /knowledge-base/projects/:projectId/bulk-import
{
  "policies": [
    { "title": "...", "content": "...", ... }
  ]
}
```

---

## 🗂️ File Structure

```
backend/
├── src/
│   ├── knowledge-base/
│   │   ├── knowledge-base.module.ts      (Module definition)
│   │   ├── knowledge-base.service.ts     (Business logic)
│   │   ├── knowledge-base.controller.ts  (Routes)
│   │   └── knowledge-base.interface.ts   (Types)
│   └── app.module.ts                     (← Register module here)
│
└── prisma/
    ├── schema.prisma                     (← Models defined here)
    └── migrations/
        └── 20260402_add_knowledge_base/
            └── migration.sql             (← Tables created)

frontend/
├── src/
│   ├── components/
│   │   └── KnowledgeBaseUpload.tsx       (← UI component)
│   └── pages/
│       └── Projects.tsx                  (← Integrate here)
```

---

## 🔑 Key Methods (Backend Service)

```typescript
// CRUD
async addPolicy(data) → Policy
async getPoliciesByProject(projectId) → Policy[]
async getPolicyById(policyId) → Policy
async updatePolicy(policyId, data) → Policy
async deletePolicy(policyId) → void

// Search & Filter
async searchPolicies(projectId, keyword) → Policy[]
async getPoliciesByCategory(projectId, category) → Policy[]
async getCategories(projectId) → string[]

// Chunks
async addChunks(policyId, chunks) → Chunk[]
async getChunksByPolicy(policyId) → Chunk[]

// Bulk & Export
async bulkAddPolicies(projectId, policies) → Policy[]
async exportPolicies(projectId) → object
async getStatistics(projectId) → Statistics
```

---

## 💾 Database Models

### Policy
```typescript
{
  id: string,           // CUID
  projectId: number,    // Foreign key
  title: string,        // Policy name
  content: string,      // Full text
  category: string?,    // Classification
  tags: string?,        // Comma-separated
  source: string,       // FILE | MANUAL | API
  isActive: boolean,    // Soft delete
  uploadedAt: Date,
  updatedAt: Date,
  chunks: Chunk[]
}
```

### Chunk
```typescript
{
  id: string,            // CUID
  policyId: string,      // Foreign key
  content: string,       // Segment text
  embeddingVector: string?, // JSON or Vector
  order: number,         // Position
  sourceRef: string?,    // Page/section
  createdAt: Date
}
```

---

## 🧪 Testing Checklist

### Backend
- [ ] Module loads on startup
- [ ] Database migration applied
- [ ] POST creating policy works
- [ ] GET listing policies works
- [ ] Search returns results
- [ ] Statistics calculated
- [ ] Delete marks inactive
- [ ] Export returns JSON

### Frontend
- [ ] Component renders
- [ ] Can add policy
- [ ] Can search
- [ ] Can delete
- [ ] Stats display
- [ ] Categories appear
- [ ] Error handling works
- [ ] Loading states show

### Integration
- [ ] Add via UI → appears in list
- [ ] Search via UI → finds policy
- [ ] Can edit and save
- [ ] Export downloads file
- [ ] Different projects isolated

---

## ⚠️ Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| Module not found | Add import to app.module.ts |
| Table not found | Run `npx prisma migrate deploy` |
| 404 from API | Verify projectId is valid |
| Component not showing | Check KnowledgeBaseUpload imported |
| Search returns nothing | Check keyword matches content |
| Stats show 0 | Verify migration and data created |

---

## 📊 Data Model Relationships

```
Project
  ├─ KnowledgeBasePolicy
  │  └─ KnowledgeBaseChunk
  └─ Projects (existing)
```

**Important:** 
- Policies scoped to projects (projectId required)
- Chunks tied to specific policies
- Soft delete via isActive flag
- Cascade delete on project removal

---

## 🔄 Typical Workflow

1. **User uploads policy** via UI form
   ```
   KnowledgeBaseUpload → POST /knowledge-base/projects/:projectId/policies
   ```

2. **Backend processes**
   ```
   Controller → Service → Prisma → PostgreSQL
   ```

3. **Database stores**
   ```
   KnowledgeBasePolicy table + KnowledgeBaseChunk table
   ```

4. **User searches**
   ```
   GET /knowledge-base/projects/:projectId/search?keyword=...
   ```

5. **RAG system retrieves**
   ```
   Chunks queried → Embeddings searched → Results returned
   ```

---

## 💡 Pro Tips

### Bulk Operations
```bash
# Import 100 policies at once
curl -X POST http://localhost:3000/knowledge-base/projects/1/bulk-import \
  -d @policies.json
```

### Backup & Restore
```bash
# Export for backup
curl http://localhost:3000/knowledge-base/projects/1/export > backup.json

# Restore from backup
curl -X POST http://localhost:3000/knowledge-base/projects/1/bulk-import \
  -d @backup.json
```

### Filter by Category
```typescript
// Frontend
const policiesByCategory = policies.filter(p => p.category === 'Security');
```

### Search Helper
```typescript
// Frontend
const searchResults = policies.filter(p => 
  p.title.toLowerCase().includes(keyword) ||
  p.content.toLowerCase().includes(keyword) ||
  p.tags?.includes(keyword)
);
```

---

## 🚨 Error Responses

```json
// Validation Error (400)
{
  "statusCode": 400,
  "message": "Policy title is required"
}

// Not Found (404)
{
  "statusCode": 404,
  "message": "Policy not found"
}

// Server Error (500)
{
  "statusCode": 500,
  "message": "Failed to add policy"
}
```

---

## 📈 Performance Tips

1. **Index queries properly** - Use projectId in filters
2. **Batch imports** - Use bulk-import for multiple policies
3. **Cache categories** - Store locally in UI
4. **Limit search** - Add pagination for large result sets
5. **Soft delete** - Use isActive filter instead of hard delete

---

## 🔗 Integration Points

### With RAG System
- Policy chunks used for context
- Embeddings stored in chunk table
- Search used for document retrieval

### With Projects
- Policies organized by project
- Each project has independent KB
- Access control at project level

### With Frontend
- Component handles UI/UX
- Calls backend APIs
- Manages local state

---

## 📞 Quick Support

### Backend Issues
```bash
npm run start:dev           # Check logs
npx prisma studio         # View database
npm run build              # Verify compilation
```

### API Issues
```bash
curl http://localhost:3000/health  # Check if running
curl http://localhost:3000/knowledge-base/projects/1/policies
```

### Database Issues
```bash
npx prisma migrate status  # Check migrations
npx prisma db push         # Resync schema
npm run prisma:reset       # Full reset
```

---

## ✅ Pre-Launch Checklist

- [ ] Module registered in app.module.ts
- [ ] Migration applied successfully
- [ ] Backend compiles cleanly
- [ ] Frontend component added to Projects
- [ ] All 10 endpoints tested
- [ ] Add policy works end-to-end
- [ ] Search functionality verified
- [ ] Delete functionality verified
- [ ] Statistics display correctly
- [ ] Error handling in place
- [ ] No console errors in browser
- [ ] Database has tables created

---

**Last Updated:** April 2, 2026
**Status:** ✅ Ready to Deploy

