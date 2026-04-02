/**
 * Use RAG endpoint to manually trigger question processing
 * This will test the fallback mechanisms
 */
const http = require('http');

// First, get a question to process
const getQuestion = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/projects/47/review',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const firstQuestion = response.questions[0];
          resolve(firstQuestion);
        } catch (e) {
          console.log('Error parsing response:', e.message);
          resolve(null);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Error:', e.message);
      resolve(null);
    });
    
    req.end();
  });
};

// Process a single question through RAG
const processQuestion = (question) => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ question });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/projects/47/rag/process-question',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          console.log('Response:', data.substring(0, 300));
          resolve(null);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e.message);
      resolve(null);
    });
    
    req.write(postData);
    req.end();
  });
};

// Main
(async () => {
  console.log('🔍 Fetching a question to process...');
  const question = await getQuestion();
  
  if (!question) {
    console.log('❌ No questions found');
    process.exit(1);
  }
  
  console.log(`\n📋 Found question: "${question.question.substring(0, 60)}..."`);
  console.log(`   ID: ${question.id}, Status: ${question.status}, Confidence: ${question.confidence}\n`);
  
  console.log('🚀 Processing through RAG pipeline...');
  const result = await processQuestion(question.question);
  
  if (result) {
    console.log('\n✅ Processing complete!');
    console.log(`📊 Result:`, JSON.stringify(result, null, 2).substring(0, 500));
  } else {
    console.log('❌ Processing failed');
  }
  
  console.log('\n💡 Next: Check /projects/47/review to see updated questions');
  process.exit(0);
})();
