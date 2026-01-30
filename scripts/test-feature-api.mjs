import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000'; // Adjust if your dev server runs on different port

async function testFeatureAPI() {
  console.log('🧪 Testing Feature Gating API Endpoints...\n');

  try {
    // Test 1: Get current premium features (should be empty initially)
    console.log('1️⃣ Testing: GET /api/super-admin/features/premium');

    const response1 = await fetch(`${API_BASE}/api/super-admin/features/premium`);
    if (response1.status === 401) {
      console.log('   ⚠️  API requires authentication - skipping auth-dependent tests');
      console.log('   💡 Run this test while logged in as super admin');
      return;
    }

    const data1 = await response1.json();
    console.log(`   Status: ${response1.status}`);
    console.log(`   Premium features count: ${data1.premiumFeatures?.length || 0}`);

    // Test 2: Make a feature premium
    console.log('\n2️⃣ Testing: POST /api/super-admin/features/premium (make teacher_payment premium)');

    const response2 = await fetch(`${API_BASE}/api/super-admin/features/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        featureCode: 'teacher_payment',
        requiredPlans: ['professional', 'enterprise'],
        isEnabled: true
      })
    });

    const data2 = await response2.json();
    console.log(`   Status: ${response2.status}`);
    if (data2.success) {
      console.log('   ✅ Successfully made teacher_payment premium');
    } else {
      console.log(`   ❌ Failed: ${data2.error}`);
    }

    // Test 3: Get premium features again (should include teacher_payment)
    console.log('\n3️⃣ Testing: GET /api/super-admin/features/premium (after adding)');

    const response3 = await fetch(`${API_BASE}/api/super-admin/features/premium`);
    const data3 = await response3.json();
    console.log(`   Status: ${response3.status}`);
    console.log(`   Premium features count: ${data3.premiumFeatures?.length || 0}`);
    data3.premiumFeatures?.forEach(pf => {
      console.log(`     - ${pf.featureCode}: ${JSON.stringify(pf.requiredPlans)}`);
    });

    // Test 4: Make feature core again
    console.log('\n4️⃣ Testing: DELETE /api/super-admin/features/premium/teacher_payment');

    const response4 = await fetch(`${API_BASE}/api/super-admin/features/premium/teacher_payment`, {
      method: 'DELETE'
    });

    const data4 = await response4.json();
    console.log(`   Status: ${response4.status}`);
    if (data4.success) {
      console.log('   ✅ Successfully made teacher_payment core again');
    } else {
      console.log(`   ❌ Failed: ${data4.error}`);
    }

    console.log('\n🎉 Feature Gating API Test Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your Next.js dev server is running: npm run dev');
  }
}

// Only run if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFeatureAPI();
}

export { testFeatureAPI };





