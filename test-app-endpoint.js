// Test script for the new app endpoint
const axios = require('axios');

async function testAppEndpoint() {
  try {
    console.log('Testing GET /api/admin/apps/1 endpoint...\n');
    
    const response = await axios.get('http://localhost:3000/api/admin/apps/1');
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.app) {
      console.log('\n✅ Endpoint working correctly!');
      console.log('App data:', response.data.data.app);
    } else {
      console.log('\n❌ Unexpected response format');
    }
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    console.log('\nMake sure:');
    console.log('1. The server is running (npm start)');
    console.log('2. The apps table exists in the database');
    console.log('3. There is a record with id=1 in the apps table');
  }
}

// Run the test
testAppEndpoint();