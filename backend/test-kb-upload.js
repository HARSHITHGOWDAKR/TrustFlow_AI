#!/usr/bin/env node

/**
 * Test script to upload a sample .txt file and view chunks
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testKnowledgeBase() {
  try {
    // Create a sample .txt file
    const sampleContent = `## Security Policy

### Access Control
Organizations must implement role-based access control (RBAC) to restrict access to sensitive information and systems. 
All users must be assigned appropriate roles based on job responsibilities. Access should be reviewed quarterly.

### Data Protection
All sensitive data must be encrypted both in transit and at rest. 
Use AES-256 for data encryption and TLS 1.2 or higher for network communications.
Personal data should be stored in isolated databases with additional security measures.

### Authentication Requirements
Multi-factor authentication (MFA) must be enabled for all administrative accounts.
Password policies should enforce minimum 12 characters with complexity requirements.
Session timeouts should be set to 30 minutes of inactivity for sensitive systems.

### Compliance Standards
The organization must comply with GDPR, CCPA, and ISO 27001 requirements.
Regular audits must be conducted to ensure compliance with data protection regulations.
All compliance violations must be reported within 72 hours.

### Incident Response
An incident response team must be established and trained for handling security breaches.
Incident response procedures should be tested at least quarterly.
All security incidents must be documented and analyzed for root cause.`;

    const fileName = 'security-policy.txt';
    fs.writeFileSync(fileName, sampleContent);
    console.log(`✅ Created sample file: ${fileName}`);

    // Upload the file to project 36
    const form = new FormData();
    form.append('file', fs.createReadStream(fileName));

    console.log('\n📤 Uploading file to knowledge base...');
    const uploadResponse = await fetch('http://localhost:3000/knowledge-base/36/ingest', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const uploadResult = await uploadResponse.json();
    console.log('\n✅ Upload Response:', uploadResult);

    if (!uploadResponse.ok) {
      console.error('❌ Upload failed:', uploadResult);
      process.exit(1);
    }

    // Wait a moment for processing
    console.log('\n⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Retrieve chunks summary
    console.log('\n📊 Fetching chunks summary...');
    const summaryResponse = await fetch('http://localhost:3000/knowledge-base/36/chunks/summary');
    const summary = await summaryResponse.json();
    console.log('\n📊 Knowledge Base Summary:');
    console.log(JSON.stringify(summary, null, 2));

    // Retrieve all chunks
    console.log('\n📦 Fetching all chunks...');
    const chunksResponse = await fetch('http://localhost:3000/knowledge-base/36/chunks');
    const chunks = await chunksResponse.json();
    console.log(`\n📦 Total Chunks: ${chunks.totalChunks}`);
    console.log(`📁 Sources: ${chunks.sources.join(', ')}`);
    
    console.log('\n🔍 Chunk Details:');
    chunks.chunks.forEach((chunk, idx) => {
      console.log(`\n--- Chunk ${idx + 1} (Index: ${chunk.chunkIndex}) ---`);
      console.log(`Source: ${chunk.source}`);
      console.log(`Length: ${chunk.chunk.length} characters`);
      console.log(`Preview: ${chunk.chunk.substring(0, 150)}...`);
    });

    // Clean up
    fs.unlinkSync(fileName);
    console.log(`\n✅ Cleaned up test file`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testKnowledgeBase();
