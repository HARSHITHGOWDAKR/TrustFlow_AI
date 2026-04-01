const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('\n========================================');
  console.log('   DATABASE CONNECTION & DATA AUDIT');
  console.log('========================================\n');

  try {
    // 1. Test connection
    console.log('1️⃣  TESTING DATABASE CONNECTION...');
    await prisma.$queryRaw`SELECT NOW()`;
    console.log('   ✅ PostgreSQL Connection: OK');

    // 2. Count all records
    console.log('\n2️⃣  COUNTING ALL RECORDS...');
    
    const projects = await prisma.project.count();
    console.log(`   📁 Projects: ${projects}`);
    
    const questions = await prisma.questionItem.count();
    console.log(`   ❓ QuestionItems: ${questions}`);
    
    const embeddings = await prisma.embedding.count();
    console.log(`   🔢 Embeddings: ${embeddings}`);
    
    const reviewEvents = await prisma.reviewEvent.count().catch(() => 0);
    console.log(`   ✏️  ReviewEvents: ${reviewEvents}`);

    // 3. Show all projects with details
    if (projects > 0) {
      console.log('\n3️⃣  PROJECTS STORED:');
      const allProjects = await prisma.project.findMany({
        include: { questions: true }
      });
      
      allProjects.forEach((proj, idx) => {
        console.log(`\n   Project #${idx + 1}: "${proj.name}"`);
        console.log(`     ID: ${proj.id}`);
        console.log(`     Created: ${proj.createdAt}`);
        console.log(`     Updated: ${proj.updatedAt}`);
        console.log(`     Questions: ${proj.questions.length}`);
      });
    }

    // 4. Show all questions with status
    if (questions > 0) {
      console.log('\n4️⃣  QUESTIONS STORED:');
      const allQuestions = await prisma.questionItem.findMany();
      
      allQuestions.forEach((q, idx) => {
        console.log(`\n   Question #${idx + 1}:`);
        console.log(`     ProjectID: ${q.projectId}`);
        console.log(`     Q: "${q.question}"`);
        console.log(`     Status: ${q.status}`);
        console.log(`     Answer: ${q.answer ? q.answer.substring(0, 60) + '...' : 'NULL'}`);
        console.log(`     Confidence: ${q.confidence}`);
      });
    }

    // 5. Show embeddings info
    if (embeddings > 0) {
      console.log('\n5️⃣  EMBEDDINGS STORED:');
      const embeddingStats = await prisma.$queryRaw`
        SELECT 
          "projectId", 
          COUNT(*) as count, 
          MIN("createdAt") as first_created,
          MAX("createdAt") as last_created
        FROM "Embedding"
        GROUP BY "projectId"
      `;
      
      embeddingStats.forEach((stat) => {
        console.log(`\n   Project ID ${stat.projectId}:`);
        console.log(`     Total embeddings: ${stat.count}`);
        console.log(`     First created: ${stat.first_created}`);
        console.log(`     Last created: ${stat.last_created}`);
      });
    }

    // 6. Show table schema info
    console.log('\n6️⃣  DATABASE TABLES:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    tables.forEach((t) => {
      console.log(`     ✓ ${t.table_name}`);
    });

    // 7. Check pgvector extension
    console.log('\n7️⃣  EXTENSIONS:');
    const extensions = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname LIKE '%vector%'
    `;
    
    if (extensions.length > 0) {
      console.log('   ✅ pgvector: INSTALLED');
    } else {
      console.log('   ⚠️  pgvector: NOT FOUND');
    }

    console.log('\n========================================');
    console.log('   ✅ DATABASE VERIFICATION COMPLETE');
    console.log('========================================\n');

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Total Data Points: ${projects + questions + embeddings + reviewEvents}`);
    console.log(`   Connection Status: ✅ ACTIVE`);
    console.log(`   Ready for Testing: ${projects > 0 ? '✅ YES' : '⚠️  NO DATA - Upload XLSX to populate'}`);

  } catch (error) {
    console.error('\n❌ DATABASE ERROR:', error.message);
    console.error('   Details:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
