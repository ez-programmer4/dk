#!/usr/bin/env node

/**
 * SendGrid Setup Helper for Darulkubra
 * This script helps you set up SendGrid for email verification
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Darulkubra SendGrid Setup Helper');
console.log('=====================================\n');

console.log('📋 SETUP STEPS:');
console.log('1. Go to https://sendgrid.com');
console.log('2. Create a free account');
console.log('3. Verify your email');
console.log('4. Go to Settings → API Keys');
console.log('5. Create a new API Key with "Full Access" permissions');
console.log('6. Copy the API Key\n');

console.log('📝 Next steps:');
console.log('1. Create a .env.local file in your project root');
console.log('2. Add: SENDGRID_API_KEY=your_api_key_here');
console.log('3. Restart your development server');
console.log('4. Test the email verification in your app\n');

console.log('📧 EMAIL SENDER DETAILS:');
console.log('- From: noreply@darulkubra.com');
console.log('- Name: Darulkubra');
console.log('- Reply-To: support@darulkubra.com\n');

console.log('🧪 TESTING:');
console.log('After setup, test by:');
console.log('1. Opening your app');
console.log('2. Clicking "Start Free Trial"');
console.log('3. Filling out registration form');
console.log('4. Clicking "Send Verification Email"');
console.log('5. Checking your email inbox for the verification code\n');

console.log('❓ NEED HELP?');
console.log('📖 Check EMAIL_SETUP_GUIDE.md for detailed instructions');
console.log('💬 Contact support if you encounter issues\n');

console.log('🎉 Ready to send real emails!');

// Create a sample .env.local if it doesn't exist
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  const sampleEnv = `# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Add your database URL and other env vars here
DATABASE_URL="your_database_url_here"
`;

  fs.writeFileSync(envPath, sampleEnv);
  console.log('📄 Created .env.local file with sample configuration');
  console.log('⚠️  IMPORTANT: Replace the placeholder values with your actual keys!\n');
}

console.log('✅ Setup complete! Follow the steps above to start sending real emails.');
