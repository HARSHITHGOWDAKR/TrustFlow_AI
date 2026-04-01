const { PrismaClient } = require('@prisma/client');

async function enableVector() {
  const prisma = new PrismaClient();

  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log('✅ pgvector extension enabled successfully');
  } catch (error) {
    console.error('❌ Failed to enable pgvector extension:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableVector();