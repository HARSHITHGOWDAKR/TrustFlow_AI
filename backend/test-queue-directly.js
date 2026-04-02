const { Queue } = require('bullmq');

const connection = {
  host: 'localhost',
  port: 6379,
};

(async () => {
  try {
    const queue = new Queue('draft-questions', { connection });
    
    console.log('Queue created, adding test job...');
    const job = await queue.add('process', { projectId: 1 });
    console.log('Job added:', job.id);
    
    // Check queue status
    const count = await queue.getJobCounts();
    console.log('Queue status:', count);
    
    // Wait a bit and check again
    console.log('\nWaiting 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));
    
    const count2 = await queue.getJobCounts();
    console.log('Queue status after 2s:', count2);
    
    // Check if job is still there
    const job2 = await queue.getJob(job.id);
    console.log('Job still exists:', !!job2, job2?.state);
    
    await queue.close();
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
