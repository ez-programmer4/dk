#!/usr/bin/env node

/**
 * Test Registration Retry with Existing Email
 */

async function testRegistrationRetry() {
  console.log('🧪 Testing Registration Retry with Existing Email...\n');

  // Test with existing email but new school name
  const testData = {
    schoolName: "Test School Retry",
    adminName: "Test Admin Retry",
    adminEmail: "ezedinebrahim131@gmail.com", // Same email as before
    adminPhone: "+251911123456",
    password: "testpass123",
    address: "123 Test St",
    city: "Addis Ababa",
    country: "Ethiopia"
  };

  try {
    console.log('📤 Testing registration with existing email...');
    console.log('Data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/schools/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Registration retry successful!');
      console.log('This means inactive admin accounts can be reused.');
    } else {
      console.log('\n❌ Registration retry failed:', result.error);
    }

  } catch (error) {
    console.log('\n❌ Network error:', error.message);
  }
}

// Run the test
testRegistrationRetry();



