#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = 36; // Use existing project

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n🚀 Knowledge Base Manager - Comprehensive Test Suite\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Get all chunks
    console.log('\n📦 TEST 1: Fetching all chunks...');
    const chunksRes = await fetch(`${BASE_URL}/knowledge-base/${PROJECT_ID}/chunks`);
    const chunksData = await chunksRes.json();
    console.log(`✅ Retrieved ${chunksData.totalChunks} chunks`);
    console.log(`   Sources: ${chunksData.sources.join(', ') || 'None'}`);

    if (chunksData.chunks.length > 0) {
      // Test 2: Get chunk summary
      console.log('\n📊 TEST 2: Fetching chunk summary...');
      const summaryRes = await fetch(`${BASE_URL}/knowledge-base/${PROJECT_ID}/chunks/summary`);
      const summaryData = await summaryRes.json();
      console.log(`✅ Total chunks: ${summaryData.totalChunks}`);
      console.log(`   Total files: ${summaryData.totalFiles}`);
      console.log(`   Total characters: ${summaryData.totalCharacters}`);

      summaryData.bySource.forEach((source) => {
        console.log(`\n   📄 File: ${source.source}`);
        console.log(`      - Chunks: ${source.chunkCount}`);
        console.log(`      - Size: ${source.totalCharacters} chars`);
        source.chunksPreview.forEach((preview) => {
          console.log(`      - Chunk ${preview.index}: ${preview.length} chars`);
        });
      });

      // Test 3: Update a chunk
      console.log('\n✏️  TEST 3: Updating a chunk...');
      const firstChunk = chunksData.chunks[0];
      const updatedContent = `UPDATED: ${firstChunk.chunk.substring(0, 50)}... [Modified at ${new Date().toISOString()}]`;

      const updateRes = await fetch(
        `${BASE_URL}/knowledge-base/${PROJECT_ID}/chunks/${firstChunk.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunk: updatedContent }),
        }
      );

      if (updateRes.ok) {
        const updateData = await updateRes.json();
        console.log(`✅ Chunk ${firstChunk.id} updated successfully`);
        console.log(`   New content length: ${updateData.chunk.chunk.length} chars`);
      } else {
        console.log(`❌ Update failed: ${updateRes.status}`);
      }

      await delay(500);

      // Test 4: Verify update
      console.log('\n🔍 TEST 4: Verifying update...');
      const verifyRes = await fetch(`${BASE_URL}/knowledge-base/${PROJECT_ID}/chunks`);
      const verifyData = await verifyRes.json();
      const updatedChunk = verifyData.chunks.find((c) => c.id === firstChunk.id);
      if (updatedChunk && updatedChunk.chunk === updatedContent) {
        console.log(`✅ Update verified successfully`);
      } else {
        console.log(`⚠️  Update verification: content differs`);
      }

      // Test 5: Delete a chunk (if there are more than 3 chunks)
      if (chunksData.chunks.length > 3) {
        console.log('\n🗑️  TEST 5: Deleting a chunk...');
        const chunkToDelete = chunksData.chunks[chunksData.chunks.length - 1];

        const deleteRes = await fetch(
          `${BASE_URL}/knowledge-base/${PROJECT_ID}/chunks/${chunkToDelete.id}`,
          { method: 'DELETE' }
        );

        if (deleteRes.ok) {
          const deleteData = await deleteRes.json();
          console.log(`✅ Chunk ${chunkToDelete.id} deleted successfully`);
        } else {
          console.log(`❌ Delete failed: ${deleteRes.status}`);
        }

        await delay(500);

        // Test 6: Verify deletion
        console.log('\n🔍 TEST 6: Verifying deletion...');
        const postDeleteRes = await fetch(`${BASE_URL}/knowledge-base/${PROJECT_ID}/chunks`);
        const postDeleteData = await postDeleteRes.json();
        if (postDeleteData.totalChunks === chunksData.totalChunks - 1) {
          console.log(`✅ Deletion verified - chunk count reduced from ${chunksData.totalChunks} to ${postDeleteData.totalChunks}`);
        } else {
          console.log(`⚠️  Deletion verification: expected ${chunksData.totalChunks - 1}, got ${postDeleteData.totalChunks}`);
        }
      } else {
        console.log('\n⚠️  TEST 5 & 6 SKIPPED: Not enough chunks to test deletion safely');
      }

      // Test 7: Summary statistics
      console.log('\n📈 TEST 7: Chunk Statistics');
      const avgSize = Math.round(summaryData.totalCharacters / summaryData.totalChunks);
      const maxChunk = Math.max(...chunksData.chunks.map((c) => c.chunk.length));
      const minChunk = Math.min(...chunksData.chunks.map((c) => c.chunk.length));

      console.log(`   Average chunk size: ${avgSize} characters`);
      console.log(`   Max chunk size: ${maxChunk} characters`);
      console.log(`   Min chunk size: ${minChunk} characters`);
      console.log(`   Density: ${((summaryData.totalCharacters / (maxChunk * summaryData.totalChunks)) * 100).toFixed(1)}%`);
    } else {
      console.log('⚠️  No chunks found - you may need to upload a file first');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!\n');
    console.log('Frontend components available:');
    console.log('  - ChunkViewer: Display chunks organized by file and index');
    console.log('  - ChunkEditor: Edit and delete individual chunks');
    console.log('  - EmbeddingVisualizer: View vector embeddings visualization');
    console.log('  - KnowledgeBaseManager: Integrated manager with all views');
    console.log('\nAccess via: Projects > Knowledge Base tab\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

runTests();
