const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/projects/47/review',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Total questions:', response.questions.length);
      
      const statuses = {};
      response.questions.forEach(q => {
        statuses[q.status] = (statuses[q.status] || 0) + 1;
      });
      
      console.log('\nStatus breakdown:');
      Object.entries(statuses).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      // Show first few questions with their details
      console.log('\nFirst 3 questions:');
      response.questions.slice(0, 3).forEach((q, i) => {
        console.log(`  ${i+1}. "${q.question.substring(0,60)}..." - ${q.status} (confidence: ${q.confidence})`);
      });
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
