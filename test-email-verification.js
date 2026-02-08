#!/usr/bin/env node

/**
 * Test Complete Email Verification Flow
 */

async function testEmailVerification() {
  console.log('🧪 Testing Complete Email Verification Flow...\n');

  // Step 1: Register a school
  console.log('1️⃣ Registering a test school...');
  const registrationData = {
    schoolName: "Email Test Academy",
    adminName: "Test Admin",
    adminEmail: "ezedinebrahim131@gmail.com", // Use real email for testing
    adminPhone: "+251911123456",
    password: "testpass123",
    address: "123 Test St",
    city: "Addis Ababa",
    country: "Ethiopia"
  };

  try {
    const regResponse = await fetch('http://localhost:3000/api/schools/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });

    const regResult = await regResponse.json();
    console.log('Registration result:', regResult);

    if (!regResponse.ok) {
      throw new Error('Registration failed: ' + regResult.error);
    }

    // Step 2: Send verification email
    console.log('\n2️⃣ Sending verification email...');
    const verificationData = {
      email: registrationData.adminEmail,
      schoolName: registrationData.schoolName,
      adminName: registrationData.adminName
    };

    const emailResponse = await fetch('http://localhost:3000/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationData)
    });

    const emailResult = await emailResponse.json();
    console.log('Email sending result:', emailResult);

    if (!emailResponse.ok) {
      throw new Error('Email sending failed: ' + emailResult.error);
    }

    console.log('\n✅ Email verification flow test completed!');
    console.log('📧 Check your email at:', registrationData.adminEmail);
    console.log('🔢 Look for a 6-digit verification code');

  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
  }
}

// Run the test
testEmailVerification();



