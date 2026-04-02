/**
 * Direct BullMQ trigger - Add job to queue and process pending questions
 * This simulates what the upload endpoint does
 */
const Queue = require('bull');

// Create queue connection (same as backend)
const draftQueue = new Queue('draft', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

async function triggerProcessing() {
  try {
    console.log('🚀 Adding draft job to BullMQ queue...');
    
    // Add job to queue (same as draftWorker.enqueueDraft)
    const job = await draftQueue.add('process', { projectId: 47 }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true
    });
    
    console.log(`✅ Job added to queue with ID: ${job.id}`);
    console.log(`📊 Job data: ${JSON.stringify(job.data)}`);
    
    // Wait a moment for job to be picked up
    setTimeout(async () => {
      const state = await job.getState();
      console.log(`📈 Job state: ${state}`);
      
      // Get queue info
      const count = await draftQueue.count();
      console.log(`📋 Jobs in queue: ${count}`);
      
      // List active jobs
      const active = await draftQueue.getActiveJobs();
      console.log(`⚙️  Active jobs: ${active.length}`);
      
      console.log('\n✓ Processing triggered!');
      console.log('Check backend logs to see questions being processed');
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error triggering processing:', error.message);
    process.exit(1);
  }
}

// Connect and execute
draftQueue.on('ready', () => {
  console.log('🔗 Connected to Redis/BullMQ');
  triggerProcessing();
});

draftQueue.on('error', (error) => {
  console.error('🔴 Queue error:', error);
  process.exit(1);
});
