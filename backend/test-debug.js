#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = 36;

async function debug() {
  console.log('🔍 Debugging Knowledge Base Endpoints\n');

  try {
    // Get all chunks
    const res = await fetch(`${BASE_URL}/knowledge-base/${PROJECT_ID}/chunks`);
    const data = await res.json();
    
    console.log('All chunks response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.chunks && data.chunks.length > 0) {
      const chunk = data.chunks[0];
      console.log(`\nTesting UPDATE on chunk ID: ${chunk.id}`);
      console.log(`Chunk details: ${JSON.stringify(chunk, null, 2)}`);
      
      // Try to update
      const updateRes = await fetch(
        `${BASE_URL}/knowledge-base/${PROJECT_ID}/chunks/${chunk.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunk: 'TEST UPDATED CONTENT' }),
        }
      );
      
      console.log(`\nUPDATE Response Status: ${updateRes.status}`);
      const updateData = await updateRes.json();
      console.log(`UPDATE Response:`, JSON.stringify(updateData, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debug();
