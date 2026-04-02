# Knowledge Base System - Integration & Deployment Guide

## 🎯 Objective

Activate the Knowledge Base system by:
1. Registering the module in the backend
2. Running database migrations
3. Integrating the frontend component
4. Testing end-to-end functionality

---

## ✅ Step 1: Register KnowledgeBaseModule in Backend

### Current Status
The Knowledge Base module is created but NOT yet registered in the main app module.

### Action Required

**File to Edit:** `backend/src/app.module.ts`

**What to do:**

1. **Add the import statement** at the top with other imports:
```typescript
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
```

2. **Add to the imports array** in the @Module decorator:
```typescript
@Module({
  imports: [
    // ... existing imports ...
    KnowledgeBaseModule,  // ← ADD THIS LINE
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Before (Current):
```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    ProjectsModule,
    ReviewModule,
    TrustflowKnowledgeModule,
    DraftModule,
    AwsIntegrationModule,
  ],
  // ...
})
```

### After (Updated):
```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    ProjectsModule,
    ReviewModule,
    TrustflowKnowledgeModule,
    DraftModule,
    AwsIntegrationModule,
    KnowledgeBaseModule,  // ← NEW
  ],
  // ...
})
```

### Verify
After editing, the module will be automatically loaded on backend startup.

---

## ✅ Step 2: Run Database Migration

### Current Status
Database schema is defined, but tables don't exist yet.

### Migration File Location
`backend/prisma/migrations/20260402_add_knowledge_base/migration.sql`

### Run Migration

**Option A: Using Prisma CLI (Recommended)**

```bash
cd backend
npx prisma migrate deploy
```

**Option B: Push schema directly**

```bash
cd backend
npx prisma db push
```

**Option C: Generate migration fresh**

```bash
cd backend
npx prisma migrate dev --name add_knowledge_base
```

### What Gets Created
The migration creates:

1. **KnowledgeBasePolicy Table**
   - Stores company policies
   - Fields: id, projectId, title, content, category, tags, source, isActive, uploadedAt, updatedAt
   - Indexes on: projectId, category, isActive

2. **KnowledgeBaseChunk Table**
   - Stores policy chunks for RAG
   - Fields: id, policyId, content, embeddingVector, order, sourceRef, createdAt
   - Index on: policyId

### Verify Migration Success

```bash
# Check if migration was applied
npx prisma migrate status

# Expected output:
# 5 migrations found in prisma/migrations
# ✓ All migrations have been applied
```

### Troubleshooting

**Error: "Can't reach database server"**
```bash
# Make sure PostgreSQL is running
# Or check CONNECTION_STRING in .env
```

**Error: "Table already exists"**
```bash
# Run this to check existing tables
npx prisma db execute --stdin
\dt  # List all tables
```

---

## ✅ Step 3: Verify Backend Compilation

### Compile Backend

```bash
cd backend
npm run build
```

### Expected Output
```
✓ Successfully compiled 1,234 modules
Compilation complete in 15s
```

### If Errors Occur

**Missing imports:**
```bash
npm install
```

**TypeScript errors:**
- Check `backend/tsconfig.json`
- Verify all types are correct

**Module not found:**
- Ensure `KnowledgeBaseModule` is exported from `knowledge-base.module.ts`
- Check file paths are correct

### Quick Validation

```bash
# Start backend in development mode (with watching)
npm run start:dev

# Expected output:
# [NestFactory] Starting Nest application...
# [InstanceLoader] PrismaModule dependencies initialized
# [InstanceLoader] KnowledgeBaseModule dependencies initialized
# Nest application successfully started on port 3000
```

---

## ✅ Step 4: Integrate Frontend Component

### Current Status
KnowledgeBaseUpload component created but NOT integrated into UI.

### Add to Projects Page

**File to Edit:** `frontend/src/pages/Projects.tsx`

**Step 1: Import the component**

Add at the top with other imports:
```typescript
import { KnowledgeBaseUpload } from '@/components/KnowledgeBaseUpload';
```

**Step 2: Add to Tabs**

Find the `<Tabs>` component and add a new tab:

```typescript
<Tabs defaultValue="overview" className="w-full">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="questions">Questions</TabsTrigger>
    <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
  </TabsList>

  {/* ... existing tab contents ... */}

  <TabsContent value="knowledge-base" className="space-y-6">
    <KnowledgeBaseUpload projectId={selectedProject.id} />
  </TabsContent>
</Tabs>
```

### Expected Result
- New "Knowledge Base" tab appears in Projects page
- Component loads with empty state
- All features accessible (add, search, filter, delete)

### Alternative: Separate Page

Or create a dedicated page:

**File:** `frontend/src/pages/KnowledgeBase.tsx`

```typescript
import { useParams } from 'react-router-dom';
import { KnowledgeBaseUpload } from '@/components/KnowledgeBaseUpload';

export function KnowledgeBasePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = parseInt(projectId || '0');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Knowledge Base</h1>
        <KnowledgeBaseUpload projectId={id} />
      </div>
    </div>
  );
}
```

Then add to router:
```typescript
import { KnowledgeBasePage } from '@/pages/KnowledgeBase';

// In routes array:
{
  path: '/projects/:projectId/knowledge-base',
  element: <KnowledgeBasePage />,
}
```

---

## ✅ Step 5: Test Each Endpoint

### Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Test Using Postman or curl

#### Test 1: Create a Policy

```bash
curl -X POST http://localhost:3000/knowledge-base/projects/1/policies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Policy",
    "content": "This is a test policy for GDPR compliance.",
    "category": "Compliance",
    "tags": ["GDPR", "test", "security"],
    "source": "MANUAL"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "policyId": "cuid_...",
  "message": "Policy 'Test Policy' added successfully",
  "policy": { ... }
}
```

#### Test 2: List All Policies

```bash
curl http://localhost:3000/knowledge-base/projects/1/policies
```

**Expected Result:** Array with 1+ policies

#### Test 3: Get Statistics

```bash
curl http://localhost:3000/knowledge-base/projects/1/statistics
```

**Expected Response:**
```json
{
  "success": true,
  "statistics": {
    "totalPolicies": 1,
    "totalChunks": 0,
    "categories": 1,
    "categoryBreakdown": [...]
  }
}
```

#### Test 4: Search Policies

```bash
curl "http://localhost:3000/knowledge-base/projects/1/search?keyword=GDPR"
```

**Expected:** Should return the policy we just created

#### Test 5: Get Categories

```bash
curl http://localhost:3000/knowledge-base/projects/1/categories
```

**Expected:** Array containing "Compliance"

#### Test 6: Frontend Component

1. Open `http://localhost:8081/projects`
2. Select a project
3. Click "Knowledge Base" tab
4. Verify:
   - Statistics load (showing 1 total policy)
   - Add Policy form is visible
   - Search works
   - Can delete policies

---

## 🔍 Verification Checklist

After completing all steps:

### Backend
- [ ] KnowledgeBaseModule imported in app.module.ts
- [ ] Database migration applied successfully
- [ ] Backend compiles without errors (`npm run build`)
- [ ] Backend starts without errors (`npm run start:dev`)
- [ ] All 10 endpoints respond correctly

### Database
- [ ] KnowledgeBasePolicy table exists
- [ ] KnowledgeBaseChunk table exists
- [ ] All indexes created
- [ ] Foreign key constraints working

### Frontend
- [ ] KnowledgeBaseUpload component imported
- [ ] Component renders in UI
- [ ] Can add new policies
- [ ] Can search policies
- [ ] Can delete policies
- [ ] Statistics display correctly

### End-to-End
- [ ] Add policy via UI → appears in database
- [ ] Search policy via UI → returns results
- [ ] Edit policy → database updates
- [ ] Delete policy → soft delete works
- [ ] Export policies → creates JSON file

---

## 🚀 Deployment Steps

### Complete Deployment Sequence

```bash
# 1. Backend Setup
cd backend
npm install                          # Install dependencies
npx prisma migrate deploy           # Run migrations
npm run build                       # Compile TypeScript
npm run start:dev                   # Start backend

# 2. Frontend Setup (in another terminal)
cd frontend
npm install                          # Install dependencies
npm run dev                          # Start dev server

# 3. Verify
# - Open http://localhost:8081
# - Navigate to Projects
# - Select project
# - Click Knowledge Base tab
# - Test adding a policy
```

### Production Deployment

```bash
# Backend
npm run build
NODE_ENV=production npm run start

# Frontend
npm run build
# Deploy dist/ folder
```

---

## 📝 Next Steps After Activation

### Immediate (Day 1)
- [ ] Verify all endpoints work
- [ ] Test UI component integration
- [ ] Create sample policies
- [ ] Test search and filtering

### Short-term (This Week)
- [ ] Add policy edit modal
- [ ] Add policy viewer with formatting
- [ ] Integrate with RAG system
- [ ] Test RAG retrieval with policies

### Medium-term (This Month)
- [ ] Policy versioning system
- [ ] Approval workflows
- [ ] Bulk import from CSV/PDF
- [ ] Export with formatting

### Long-term (Q2)
- [ ] AI-powered policy summarization
- [ ] Automated compliance checking
- [ ] Policy impact analysis
- [ ] Version comparison and diffing

---

## 🆘 Troubleshooting Guide

### Module Not Loading

**Symptom:** Error "Cannot find module 'KnowledgeBaseModule'"

**Solution:**
```bash
# 1. Verify file exists
ls backend/src/knowledge-base/knowledge-base.module.ts

# 2. Check it's exported
# File should start with: export class KnowledgeBaseModule

# 3. Rebuild
npm run build

# 4. Restart backend
npm run start:dev
```

### Database Migration Failed

**Symptom:** "Migration failed" when running `prisma migrate deploy`

**Solution:**
```bash
# 1. Check connection string
echo $DATABASE_URL

# 2. Verify PostgreSQL is running
pg_isready -h localhost -p 5432

# 3. Check if migration partially applied
npx prisma migrate status

# 4. Try creating tables manually if needed
npx prisma db push
```

### Component Not Rendering

**Symptom:** Knowledge Base tab appears but component doesn't load

**Solution:**
```bash
# 1. Check browser console for errors
# Open DevTools → Console tab

# 2. Verify projectId is being passed
console.log(projectId)

# 3. Check API endpoints are accessible
curl http://localhost:3000/knowledge-base/projects/1/statistics

# 4. Clear cache and reload
# Ctrl+Shift+Delete or Cmd+Shift+Delete
```

### API Returns 500 Error

**Symptom:** API endpoint returns server error

**Solution:**
```bash
# 1. Check backend logs for error message
# Look for: [ERROR] or error stack trace

# 2. Verify database is accessible
npx prisma studio

# 3. Check if migration completed
ngx prisma migrate status

# 4. Restart backend
npm run start:dev
```

---

## 📊 Performance Expectations

### Response Times
- Add policy: ~100-200ms
- List policies: ~50-100ms
- Search: ~100-300ms (depending on data size)
- Get statistics: ~50-100ms

### Scalability
- Supports up to 10,000 policies per project
- Chunks indexed for fast retrieval
- Query optimization with database indexes

---

## 📞 Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review backend logs: `npm run start:dev`
3. Check browser console: F12 → Console
4. Verify database: `npx prisma studio`

---

**Status:** Ready for Implementation
**Created:** April 2, 2026

