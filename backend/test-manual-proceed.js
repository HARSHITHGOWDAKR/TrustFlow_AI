const http = require('http');

// Manually trigger processing for Project 47
const postData = JSON.stringify({ projectId: 47 });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/projects/47/review',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// First, let's just try to make a request that triggers processing
// Actually, let's use a different approach - directly add to queue via the test script

// Simple HTTP request to test if backend is working
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/projects',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Backend is responding');
    console.log('Next step: Need to manually enqueue Project 47');
    console.log('\nManual enqueueing instructions:');
    console.log('1. Check if queue is operational');
    console.log('2. Add job to Bull queue for project 47');
  });
});

req.on('error', e => {
  console.error('Error:', e.message);
});

req.end();
