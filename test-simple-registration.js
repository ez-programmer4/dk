#!/usr/bin/env node

/**
 * Test Simple Registration API
 */

async function testSimpleRegistration() {
  console.log('🧪 Testing Simple Registration API...\n');

  const testData = {
    schoolName: "Simple Test Academy",
    adminName: "Simple Admin",
    adminEmail: "simple@example.com",
    password: "testpass123"
  };

  try {
    console.log('📤 Sending request to /api/schools/register-simple...');
    console.log('Data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/schools/register-simple', {
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
      console.log('\n✅ Simple registration successful!');
    } else {
      console.log('\n❌ Simple registration failed:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
    }

  } catch (error) {
    console.log('\n❌ Network error:', error.message);
  }
}

// Run the test
testSimpleRegistration();







