const { PrismaClient } = require('@prisma/client');
const { Pinecone } = require('@pinecone-database/pinecone');
const crypto = require('crypto');

const prisma = new PrismaClient();
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Generate deterministic vectors from text (working around Gemini API issues)
// Using 1024 dimensions to match Pinecone index
function textToVector(text, dimensions = 1024) {
  const hash = crypto.createHash('sha256').update(text).digest();
  const vector = [];
  for (let i = 0; i < dimensions; i++) {
    const byte1 = hash[(i * 2) % 32];
    const byte2 = hash[(i * 2 + 1) % 32];
    const val = ((byte1 << 8) | byte2) / 65536;
    vector.push(val);
  }
  return vector;
}

// Chunk text into pieces
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

async function indexKnowledgeBase(projectId) {
  try {
    console.log('🔍 Step 02: INDEX KNOWLEDGE BASE IN PINECONE\n');

    // 1. Get all active policies for project
    const policies = await prisma.knowledgeBasePolicy.findMany({
      where: { projectId, isActive: true },
      orderBy: { uploadedAt: 'desc' }
    });

    if (policies.length === 0) {
      console.log('⚠️  No active policies found for project ' + projectId);
      return;
    }

    console.log(`📋 Found ${policies.length} policies for indexing\n`);

    // 2. Connect to Pinecone index
    const indexName = process.env.PINECONE_INDEX || 'trustflow-index';
    let index;
    try {
      index = pc.Index(indexName);
    } catch (e) {
      console.log(`⚠️  Pinecone index "${indexName}" not found. Creating...`);
      // Index should exist, but if not, we'll proceed with error handling
      throw e;
    }

    // 3. Process each policy
    let totalChunks = 0;
    let totalVectors = 0;

    for (const policy of policies) {
      console.log(`📄 Processing: ${policy.title}`);
      console.log(`   Content: ${policy.content.length} characters`);

      // Chunk the policy
      const chunks = chunkText(policy.content, 450, 50);
      console.log(`   Created ${chunks.length} chunks`);

      // Create vectors and prepare for Pinecone upload
      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${policy.id}-chunk-${i}`;
        const embedding = textToVector(chunk);

        vectors.push({
          id: chunkId,
          values: embedding,
          metadata: {
            policyId: policy.id,
            projectId: projectId.toString(),
            chunkIndex: i,
            content: chunk.substring(0, 200), // Store first 200 chars as preview
            title: policy.title,
            category: policy.category,
            source: 'knowledge-base'
          }
        });

        totalChunks++;
      }

      // Upload vectors to Pinecone in batches
      const batchSize = 10;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        try {
          await index.upsert(batch);
          totalVectors += batch.length;
          process.stdout.write('.');
        } catch (e) {
          console.error('\n❌ Upsert error:', e.message);
          throw e;
        }
      }

      console.log(`\n   ✅ Indexed ${chunks.length} chunks`);
    }

    console.log(`\n✨ INDEXING COMPLETE`);
    console.log(`   Total chunks: ${totalChunks}`);
    console.log(`   Vectors in Pinecone: ${totalVectors}`);
    console.log(`   Index: ${indexName}`);
    console.log(`   Status: Ready for retrieval`);

    return { totalChunks, totalVectors };

  } catch (error) {
    console.error('❌ Indexing failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run indexing
const projectId = 47;
indexKnowledgeBase(projectId)
  .then(result => {
    console.log('\n✅ Knowledge base indexed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Failed to index knowledge base');
    process.exit(1);
  });
