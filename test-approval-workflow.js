#!/usr/bin/env node

/**
 * Test Complete Approval Workflow
 */

async function testApprovalWorkflow() {
  console.log('🧪 Testing Complete Approval Workflow...\n');

  // Step 1: Register a new school
  console.log('1️⃣ Registering a new school...');
  const timestamp = Date.now();
  const registrationData = {
    schoolName: `Approval Test School ${timestamp}`,
    adminName: "Test Admin",
    adminEmail: `approval${timestamp}@example.com`,
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

    if (!regResponse.ok) {
      throw new Error('Registration failed: ' + JSON.stringify(regResult));
    }

    console.log('✅ School registered successfully');
    const schoolId = regResult.school.id;
    console.log('School ID:', schoolId);

    // Step 2: Approve the school
    console.log('\n2️⃣ Approving the school...');

    const approvalResponse = await fetch(`http://localhost:3000/api/super-admin/school-registrations/${schoolId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' })
    });

    const approvalResult = await approvalResponse.json();

    if (!approvalResponse.ok) {
      throw new Error('Approval failed: ' + JSON.stringify(approvalResult));
    }

    console.log('✅ School approved successfully!');
    console.log('Approval result:', approvalResult);

    console.log('\n🎉 Complete approval workflow test successful!');
    console.log('📧 Check email for approval notification');
    console.log('🎨 School can now access branding setup');
    console.log('🔑 Admin account is now active');

  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
  }
}

// Run the test
testApprovalWorkflow();








