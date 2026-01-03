// Script to add test subscription data
// Run this with: node add-test-subscription.js

const subscriptionData = {
  studentId: 9595, // From your data: studentId (metadata)
  stripeSubscriptionId: "sub_1SXVX0AoqPpU95beDAInXBlH",
  stripeCustomerId: "cus_TUUVemZR6EHCXT",
  packageName: "3", // From packageName (metadata)
  packageDuration: "1month", // From packageDuration (metadata)
  amount: "90", // From Amount column
  currency: "usd", // From Currency column
  status: "active", // From Status column
  startDate: "2025-11-25T23:20:00Z", // From Start Date (UTC)
  endDate: "2026-02-25T23:20:00Z", // From Current Period End (UTC)
  customerEmail: "bedhanan@gmail.com"
};

async function addSubscription() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/manual-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add proper authentication headers here
        // 'Authorization': 'Bearer YOUR_ADMIN_TOKEN'
      },
      body: JSON.stringify(subscriptionData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Subscription added successfully:', result);
    } else {
      console.error('❌ Error adding subscription:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Uncomment the line below to run the script
// addSubscription();

console.log('📋 Subscription data to add:');
console.log(JSON.stringify(subscriptionData, null, 2));
console.log('\n🔧 To add this subscription:');
console.log('1. Make sure your server is running');
console.log('2. Login as admin to get proper authentication');
console.log('3. Use the API endpoint: POST /api/admin/manual-subscription');
console.log('4. Or uncomment the last line and run: node add-test-subscription.js');