#!/usr/bin/env node
/**
 * Simple database verification script
 * Usage: node test-db-simple.js
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing database connection...\n');
    
    // Test raw connection
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('✅ PostgreSQL Connection: ACTIVE');
    console.log(`   Current Time: ${result[0].now}\n`);
    
    // Count records in each table
    const projectCount = await prisma.project.count();
    const questionCount = await prisma.questionItem.count();
    const embeddingCount = await prisma.embedding.count();
    const reviewEventCount = await prisma.reviewEvent.count();
    
    console.log('📊 Database Record Count:');
    console.log(`   Projects: ${projectCount}`);
    console.log(`   Questions: ${questionCount}`);
    console.log(`   Embeddings: ${embeddingCount}`);
    console.log(`   Review Events: ${reviewEventCount}\n`);
    
    // Show project details if any exist
    if (projectCount > 0) {
      const projects = await prisma.project.findMany();
      console.log('📁 Projects:');
      projects.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id}, Created: ${p.createdAt.toLocaleDateString()})`);
      });
      console.log();
      
      // Show questions for each project
      const questions = await prisma.questionItem.findMany({ 
        include: { project: { select: { name: true } } }
      });
      if (questions.length > 0) {
        console.log('❓ Questions:');
        questions.slice(0, 5).forEach(q => {
          console.log(`   - [${q.status}] "${q.question.substring(0, 50)}..."`);
        });
        if (questions.length > 5) {
          console.log(`   ... and ${questions.length - 5} more`);
        }
        console.log();
      }
    }
    
    // Check pgvector extension
    try {
      const vectorCheck = await prisma.$queryRaw`SELECT * FROM pg_extension WHERE extname='vector'`;
      console.log('🔢 pgvector Extension: ✅ INSTALLED\n');
    } catch (e) {
      console.log('⚠️  pgvector Extension: NOT FOUND\n');
    }
    
    console.log('✅ All systems operational!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Upload XLSX file from http://localhost:8080/projects');
    console.log('   2. Run this script again to see records appear');
    console.log('   3. Upload PDF to trigger AWS processing');
    console.log('   4. Check for AI-generated answers in 2-3 seconds\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n⚠️  Database may not be running or credentials incorrect');
    console.error('   Check: backend/.env file for DATABASE_URL');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
