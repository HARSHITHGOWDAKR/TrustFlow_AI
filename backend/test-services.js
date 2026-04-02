/**
 * Comprehensive service health check
 * Tests: Database, Gemini API, Pinecone API
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

// Load .env manually
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, value] = line.split('=');
    env[key.trim()] = value.trim();
  }
});

// Merge with process.env
Object.assign(process.env, env);

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000';

async function testDatabase() {
  console.log('\n📊 Testing Database Connection...');
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database: Connected to PostgreSQL');
    
    // Get count of projects
    const projectCount = await prisma.project.count();
    console.log(`   Projects in DB: ${projectCount}`);
    
    // Get count of questions
    const questionCount = await prisma.questionItem.count();
    console.log(`   Questions in DB: ${questionCount}`);
    
    return true;
  } catch (error) {
    console.log('❌ Database: Connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testGeminiAPI() {
  console.log('\n🤖 Testing Gemini API...');
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('❌ Gemini: API key not configured');
      return false;
    }
    
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Say "OK" only');
    const text = result.response.text();
    
    if (text.includes('OK')) {
      console.log('✅ Gemini API: Working');
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Gemini API: Failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testPineconeAPI() {
  console.log('\n📌 Testing Pinecone API...');
  try {
    const { Pinecone } = require('@pinecone-database/pinecone');
    const apiKey = process.env.PINECONE_API_KEY;
    
    if (!apiKey) {
      console.log('❌ Pinecone: API key not configured');
      return false;
    }
    
    const client = new Pinecone({ apiKey });
    const index = client.Index(process.env.PINECONE_INDEX || 'trustflow-index');
    
    // Try to describe the index (lightweight check)
    await index.describeIndexStats();
    
    console.log('✅ Pinecone API: Connected');
    return true;
  } catch (error) {
    console.log('❌ Pinecone API: Failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testBackendAPI() {
  console.log('\n🌐 Testing Backend API Endpoints...');
  try {
    // Test root endpoint
    const root = await axios.get(`${API_BASE}/`);
    console.log('✅ GET / : Working');
    
    // Test projects endpoint
    try {
      const projects = await axios.get(`${API_BASE}/projects`);
      console.log(`✅ GET /projects : Working (${projects.data.length || 0} projects)`);
    } catch (e) {
      console.log(`⚠️  GET /projects : ${e.response?.status} - ${e.response?.data?.message || e.message}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Backend API: Not responding');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testFileUpload() {
  console.log('\n📤 Testing File Upload Endpoint...');
  try {
    // Create a test text file
    const fs = require('fs');
    const testContent = 'This is a test security policy.\n\nOur company uses AES-256 encryption for data at rest.\n\nAccess is restricted through role-based access control (RBAC).';
    const testFilePath = 'test-policy.txt';
    fs.writeFileSync(testFilePath, testContent);
    
    // First create a project
    const projectRes = await axios.post(`${API_BASE}/projects/upload`, 
      { projectName: 'Test Project', questionnaire: '[]' },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const projectId = projectRes.data.id;
    console.log(`✅ Created test project: ${projectId}`);
    
    // Now test file upload
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    
    const uploadRes = await axios.post(
      `${API_BASE}/knowledge-base/${projectId}/ingest`,
      form,
      { headers: form.getHeaders() }
    );
    
    console.log('✅ File Upload: Working');
    console.log(`   Chunks ingested: ${uploadRes.data.chunkCount || 0}`);
    
    // Cleanup
    fs.unlinkSync(testFilePath);
    
    return true;
  } catch (error) {
    console.log('❌ File Upload: Failed');
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🔍 TRUSTFLOW SERVICE HEALTH CHECK');
  console.log('=====================================');
  
  const results = {
    database: await testDatabase(),
    gemini: await testGeminiAPI(),
    pinecone: await testPineconeAPI(),
    backend: await testBackendAPI(),
    fileUpload: await testFileUpload(),
  };
  
  console.log('\n📋 Summary:');
  console.log('=====================================');
  let passed = 0;
  let failed = 0;
  
  for (const [service, result] of Object.entries(results)) {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${service.toUpperCase()}: ${result ? 'PASS' : 'FAIL'}`);
    result ? passed++ : failed++;
  }
  
  console.log('=====================================');
  console.log(`Total: ${passed} passed, ${failed} failed`);
  
  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

runAllTests().catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
});
