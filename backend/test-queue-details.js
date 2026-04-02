const { Queue } = require('bullmq');

const connection = {
  host: 'localhost',
  port: 6379,
};

(async () => {
  try {
    const queue = new Queue('draft-questions', { connection });
    
    // Get failed jobs
    const failedJobs = await queue.getFailed(0, -1);
    console.log('Failed jobs:', failedJobs.length);
    
    for (const job of failedJobs) {
      console.log('\nFailed Job ID:', job.id);
      console.log('Data:', job.data);
      console.log('Attempts failed:', job.attemptsMade);
      console.log('Failed reason:', job.failedReason);
      console.log('Stack trace:', job.stacktrace?.join('\n'));
    }
    
    // Also check active jobs
    const activeJobs = await queue.getActive();
    console.log('\n\nActive jobs:', activeJobs.length);
    
    // Check completed jobs (last 5)
    const completedJobs = await queue.getCompleted(0, 4);
    console.log('\nLast 5 completed jobs:');
    for (const job of completedJobs) {
      console.log(`  Job ${job.id}: processed in ${job.processedOn ? Date.now() - job.processedOn : '?'}ms`);
    }
    
    await queue.close();
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message, e.stack);
    process.exit(1);
  }
})();
