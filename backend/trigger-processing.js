const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/projects/47/trigger-processing',
  method: 'POST'
}, (r) => {
  let d = '';
  r.on('data', chunk => d += chunk);
  r.on('end', () => {
    try {
      const result = JSON.parse(d);
      console.log('✅ Response:', result);
    } catch (e) {
      console.log(d);
    }
    process.exit(0);
  });
});

req.on('error', e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});

req.end();
