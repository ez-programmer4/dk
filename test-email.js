#!/usr/bin/env node

/**
 * Test Email Sending with Resend
 * Run this to test if your Resend setup works
 */

require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

async function testEmailSending() {
  console.log('🧪 Testing Resend Email Integration...\n');

  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in .env.local');
    console.log('📝 Add your Resend API key to .env.local:');
    console.log('   RESEND_API_KEY=re_your_api_key_here\n');
    console.log('🔗 Get your key at: https://resend.com');
    return;
  }

  // Initialize Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log('📧 Sending test email...');

    // Send a test email
    const { data, error } = await resend.emails.send({
      from: 'Darulkubra <onboarding@resend.dev>',
      to: ['ezedinebrahim131@gmail.com'], // Your Resend account email
      subject: '🧪 Test Email from Darulkubra',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1f2937;">Test Email Successful! 🎉</h1>
          <p>Your Resend integration is working perfectly.</p>
          <p><strong>API Key:</strong> ${process.env.RESEND_API_KEY.substring(0, 10)}...</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <hr>
          <p style="color: #6b7280; font-size: 12px;">Darulkubra Email Test</p>
        </div>
      `,
    });

    if (error) {
      console.log('❌ Email sending failed:');
      console.log(error);
      return;
    }

    console.log('✅ Test email sent successfully!');
    console.log('📨 Email ID:', data.id);
    console.log('📧 Check your inbox at: test@example.com\n');

    console.log('🎯 Next steps:');
    console.log('1. Change the email address in this script to your real email');
    console.log('2. Run: node test-email.js');
    console.log('3. Check your inbox for the test email');
    console.log('4. If you receive it, your Resend setup is working!');

  } catch (err) {
    console.log('❌ Error testing email:', err.message);
  }
}

// Run the test
testEmailSending();
