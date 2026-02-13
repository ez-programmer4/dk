#!/usr/bin/env node

/**
 * Test Final School Registration with Email Verification
 */

async function testFinalRegistration() {
  console.log('🧪 Testing Final School Registration Flow...\n');

  // Test data
  const testData = {
    schoolName: "Akhlaq Islamic Academy",
    adminName: "Ezedin Ebrahim",
    adminEmail: "ezedinebrahim123@gmail.com",
    adminPhone: "+251991792427",
    password: "securePass123!",
    address: "Addis Ababa",
    city: "Addis Ababa",
    country: "Ethiopia"
  };

  try {
    console.log('1️⃣ Registering school...');
    const regResponse = await fetch('http://localhost:3000/api/schools/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const regResult = await regResponse.json();

    if (regResponse.ok) {
      console.log('✅ Registration successful!');
      console.log('📊 School:', regResult.school);
      console.log('👤 Admin:', regResult.admin);
    } else {
      console.log('❌ Registration failed:', regResult.error);
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run the test
testFinalRegistration();







