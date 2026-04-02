const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const fs = require('fs');
const axios = require('axios');

const prisma = new PrismaClient();

async function uploadSecurityQuestions(projectId, filePath = './security-queries.xlsx') {
  try {
    console.log('📝 STEP 03: UPLOAD SECURITY QUESTIONS\n');

    // Read Excel file
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`📄 Reading: ${filePath}`);
    console.log(`   Sheet: ${sheetName}`);
    console.log(`   Total questions: ${data.length}\n`);

    // Insert questions into database
    let insertedCount = 0;
    for (const row of data) {
      const question = row.Question || row.question;
      if (!question) continue;

      await prisma.questionItem.create({
        data: {
          projectId,
          question: question.trim(),
          status: 'pending',
          intakeCategory: row.Category || 'security'
        }
      });
      insertedCount++;
    }

    console.log(`✅ Questions inserted into database`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Questions added: ${insertedCount}`);

    // Fetch project to verify
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { questions: { select: { id: true, status: true } } }
    });

    console.log(`\n📊 Project Status:`);
    console.log(`   Total questions: ${project.questions.length}`);
    console.log(`   Project: ${project.name || 'Project ' + projectId}`);

    // Trigger processing via API
    console.log(`\n🚀 STEP 04: TRIGGER RAG PIPELINE\n`);
    
    const raiseResponse = await axios.post(
      'http://localhost:3000/agents/process-project',
      { projectId },
      { timeout: 5000 }
    ).catch(e => {
      if (e.response?.status === 404) {
        console.log('ℹ️  Endpoint not found - processing will happen via BullMQ queue');
        return null;
      }
      throw e;
    });

    if (raiseResponse) {
      console.log(`✅ Processing triggered`);
      console.log(`   Jobs queued: ${raiseResponse.data.queuedCount || '.'}`);
    } else {
      console.log('✅ Questions ready for processing');
    }

    console.log(`\n⏳ Next: Questions processing through 4-agent pipeline`);
    console.log(`  1. Intake Agent: Classify & expand query`);
    console.log(`  2. Retrieval Agent: Search knowledge base (17 chunks indexed in Pinecone)`);
    console.log(`  3. Drafter Agent: Generate answer using Mistral-7B`);
    console.log(`  4. Critic Agent: Evaluate confidence & citations`);

    return { insertedCount, projectId };

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run upload
const projectId = 47;
uploadSecurityQuestions(projectId)
  .then(result => {
    console.log('\n✅ Questions uploaded successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Failed to upload questions');
    process.exit(1);
  });
