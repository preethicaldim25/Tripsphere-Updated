// Save as test-backend.js in your frontend folder
// Run with: node test-backend.js

const http = require('http');

const IP = '192.168.1.74';  // Change to your IP
const PORT = 8000;

const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health',
  },
  {
    name: 'Register Test User',
    method: 'POST',
    path: '/api/auth/register',
    body: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }
  },
  {
    name: 'Login Test User',
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: 'test@example.com',
      password: 'password123'
    }
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n📌 Testing: ${test.name}`);
    console.log(`URL: http://${IP}:${PORT}${test.path}`);
    
    const options = {
      hostname: IP,
      port: PORT,
      path: test.path,
      method: test.method,
      headers: test.body ? { 'Content-Type': 'application/json' } : {},
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.access_token) {
              console.log('✅ Got access token!');
            } else {
              console.log('Response:', parsed);
            }
          } catch {
            console.log('Response:', data.substring(0, 100));
          }
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ SUCCESS');
        } else {
          console.log('❌ FAILED');
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ Error:', e.message);
      console.log('💡 Make sure:');
      console.log('   1. Backend is running (python -m uvicorn main:app --host 0.0.0.0 --port 8000)');
      console.log('   2. Firewall allows port 8000');
      console.log('   3. IP address is correct');
      resolve();
    });
    
    if (test.body) {
      req.write(JSON.stringify(test.body));
    }
    
    req.end();
  });
}

async function runAllTests() {
  console.log('=================================');
  console.log('🔍 TESTING BACKEND CONNECTION');
  console.log(`🌐 Target: http://${IP}:${PORT}`);
  console.log('=================================');
  
  for (const test of tests) {
    await runTest(test);
  }
  
  console.log('\n=================================');
  console.log('✅ Testing complete!');
  console.log('If all tests passed, your backend is working!');
  console.log('Now try logging in from the app.');
}

runAllTests();