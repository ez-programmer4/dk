#!/usr/bin/env node

/**
 * Test Registration with New Email
 */

async function testNewRegistration() {
  console.log('🧪 Testing Registration with New Email...\n');

  // Generate a unique email for testing
  const timestamp = Date.now();
  const testData = {
    schoolName: `Test School ${timestamp}`,
    adminName: "New Test Admin",
    adminEmail: `newtest${timestamp}@example.com`, // Unique email
    adminPhone: "+251911123456",
    password: "testpass123",
    address: "123 Test St",
    city: "Addis Ababa",
    country: "Ethiopia"
  };

  try {
    console.log('📤 Testing registration with new email...');
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
      console.log('\n✅ Registration with new email successful!');
      console.log('School:', result.school.name);
      console.log('Admin Email:', result.admin.email);
    } else {
      console.log('\n❌ Registration failed:', result.error);
    }

  } catch (error) {
    console.log('\n❌ Network error:', error.message);
  }
}

// Run the test
testNewRegistration();
