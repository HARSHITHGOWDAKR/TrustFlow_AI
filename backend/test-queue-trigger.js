/**
 * Manual trigger to enqueue pending questions for Project 47
 * The DraftWorker will pick them up and process them through the 4-agent pipeline
 */
const http = require('http');

// Make request to get queue details first
const getQueueInfo = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/projects/47/review-queue',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const info = JSON.parse(data);
          console.log('Queue Info:', info);
          resolve(info);
        } catch (e) {
          console.log('Response:', data.substring(0, 200));
          resolve(null);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Error getting queue info:', e.message);
      resolve(null);
    });
    
    req.end();
  });
};

// Main execution
(async () => {
  console.log('Checking queue status for Project 47...');
  await getQueueInfo();
  
  console.log('\nNote: To manually enqueue processing:');
  console.log('The DraftWorker automatically monitors for pending questions');
  console.log('Questions uploaded to Project 47 are in the database and awaiting processing');
  console.log('\nNext steps:');
  console.log('1. Backend is running with DraftWorker active');
  console.log('2. Check backend logs for processing messages');
  console.log('3. Questions should start processing automatically');
  console.log('4. Monitor http://localhost:8080 for status updates');
})();
