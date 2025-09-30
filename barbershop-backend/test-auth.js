// Simple test script to verify authentication endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:6000/api';

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: 'test@barbershop.com',
      password: 'test123',
      name: 'Test User'
    });
    console.log('✅ Registration successful:', registerResponse.data.user.email);

    // Test 2: Login with the new user
    console.log('\n2. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@barbershop.com',
      password: 'test123'
    });
    console.log('✅ Login successful:', loginResponse.data.user.name);
    const token = loginResponse.data.token;

    // Test 3: Access protected endpoint
    console.log('\n3. Testing protected endpoint access...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile access successful:', profileResponse.data.user.email);

    // Test 4: Test booking endpoint (protected)
    console.log('\n4. Testing protected booking endpoint...');
    const bookingsResponse = await axios.get(`${BASE_URL}/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Bookings access successful, found', bookingsResponse.data.length, 'bookings');

    // Test 5: Test without token (should fail)
    console.log('\n5. Testing access without token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/bookings`);
      console.log('❌ This should have failed!');
    } catch (error) {
      console.log('✅ Correctly rejected request without token:', error.response.data.error);
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

// Run the test
testAuth();
