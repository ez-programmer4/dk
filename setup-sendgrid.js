#!/usr/bin/env node

/**
 * Resend Email Setup Helper for Darulkubra
 * This script helps you set up Resend for email verification
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Darulkubra Resend Email Setup Helper');
console.log('=======================================\n');

console.log('📋 SETUP STEPS:');
console.log('1. Go to https://resend.com');
console.log('2. Create a free account (3,000 emails/month free!)');
console.log('3. Verify your email');
console.log('4. Go to API Keys section');
console.log('5. Create a new API Key');
console.log('6. Copy the API Key\n');

console.log('📝 Next steps:');
console.log('1. Open .env.local file in your project root');
console.log('2. Add: RESEND_API_KEY=your_api_key_here');
console.log('3. Restart your development server');
console.log('4. Test the email verification in your app\n');

console.log('📧 EMAIL SENDER DETAILS:');
console.log('- From: Darulkubra <noreply@darulkubra.com>');
console.log('- Reply-To: support@darulkubra.com');
console.log('- Beautiful HTML templates included\n');

console.log('🧪 TESTING:');
console.log('After setup, test by:');
console.log('1. Opening your app at http://localhost:3000');
console.log('2. Clicking "Start Free Trial"');
console.log('3. Filling out registration form');
console.log('4. Clicking "Send Verification Email"');
console.log('5. Checking your email inbox for the verification code\n');

console.log('💡 WHY RESEND?');
console.log('• 3,000 free emails/month');
console.log('• No credit card required');
console.log('• Beautiful email templates');
console.log('• Excellent deliverability');
console.log('• Developer-friendly API\n');

console.log('❓ NEED HELP?');
console.log('📖 Check EMAIL_SETUP_GUIDE.md for detailed instructions');
console.log('💬 Visit https://resend.com/docs for API docs\n');

console.log('🎉 Ready to send real emails!');

// Create or update .env.local with Resend config
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Check if RESEND_API_KEY already exists
if (envContent.includes('RESEND_API_KEY=')) {
  console.log('📄 .env.local already has RESEND_API_KEY configured');
} else {
  // Remove old SendGrid config if exists
  envContent = envContent.replace(/SENDGRID_API_KEY=.*/g, '');

  // Add Resend config
  const resendConfig = envContent.trim()
    ? `${envContent}\n\n# Resend Email Service\nRESEND_API_KEY=your_resend_api_key_here\n`
    : `# Resend Email Service\nRESEND_API_KEY=your_resend_api_key_here\n\n# Add your database URL and other env vars here\nDATABASE_URL="your_database_url_here"\n`;

  fs.writeFileSync(envPath, resendConfig);
  console.log('📄 Updated .env.local with Resend configuration');
  console.log('⚠️  IMPORTANT: Replace "your_resend_api_key_here" with your actual Resend API key!\n');
}

console.log('✅ Setup complete! Follow the steps above to start sending real emails.');
console.log('🔗 Visit: https://resend.com to get your API key');

