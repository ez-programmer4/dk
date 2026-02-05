#!/usr/bin/env node

/**
 * Test School Registration API
 */

async function testRegistration() {
  console.log('🧪 Testing School Registration API...\n');

  const testData = {
    schoolName: "Test Islamic Academy",
    adminName: "Ahmed Al-Rashid",
    adminEmail: "ahmed@example.com",
    adminPhone: "+251911123456",
    password: "securePass123!",
    address: "123 Knowledge Street",
    city: "Addis Ababa",
    country: "Ethiopia"
  };

  try {
    console.log('📤 Sending registration request...');
    console.log('Data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/schools/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Registration successful!');
    } else {
      console.log('\n❌ Registration failed:', result.error);
    }

  } catch (error) {
    console.log('\n❌ Network error:', error.message);
  }
}

// Run the test
testRegistration();
