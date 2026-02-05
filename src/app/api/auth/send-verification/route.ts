import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { email, schoolName, adminName } = await request.json();

    if (!email || !schoolName || !adminName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the verification code (in a real app, you'd use Redis, database, etc.)
    // For demo purposes, we'll just log it
    console.log(`Verification code for ${email}: ${verificationCode}`);

    // In a real implementation, you would:
    // 1. Store the code in a database/cache with expiration
    // 2. Send an email using a service like SendGrid, AWS SES, etc.

    // Send real email using Resend
    try {
      if (!resend || !process.env.RESEND_API_KEY) {
        // Fallback to testing mode if no API key
        console.log('🧪 TESTING MODE - VERIFICATION EMAIL WOULD BE SENT TO:', email);
        console.log('📧 SUBJECT:', `Verify Your Darulkubra School Registration - ${schoolName}`);
        console.log('🔢 CODE:', verificationCode);
        console.log('👤 SENDER: noreply@darulkubra.com (Darulkubra)');
        console.log('⚠️  Add RESEND_API_KEY to .env.local for real email sending');
        console.log('🔗 Get your key at: https://resend.com');
      } else {
        // Send real email with Resend
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Darulkubra Account</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Welcome to Darulkubra</h1>
                <p style="color: #6b7280; margin: 10px 0;">Islamic Education Technology Platform</p>
              </div>

              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
                <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">${adminName}</h2>
                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
                  Thank you for registering <strong>${schoolName}</strong>
                </p>
              </div>

              <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px solid #e2e8f0;">
                <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px;">
                  Your verification code is:
                </p>
                <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #cbd5e1; display: inline-block;">
                  <h1 style="color: #1e293b; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">
                    ${verificationCode}
                  </h1>
                </div>
                <p style="color: #64748b; margin: 20px 0 0 0; font-size: 14px;">
                  ⏰ This code expires in <strong>10 minutes</strong>
                </p>
              </div>

              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                  Didn't request this? You can safely ignore this email.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

              <div style="text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  Darulkubra - Empowering Islamic Education
                </p>
                <p style="color: #94a3b8; font-size: 12px; margin: 5px 0;">
                  📧 <a href="mailto:support@darulkubra.com" style="color: #3b82f6;">support@darulkubra.com</a> |
                  🌐 <a href="https://darulkubra.com" style="color: #3b82f6;">darulkubra.com</a>
                </p>
              </div>
            </body>
          </html>
        `;

        // For testing without domain verification, send to Resend account email
        // In production, change this to: to: [email]
        const recipientEmail = process.env.NODE_ENV === 'production' ? email : (process.env.RESEND_TEST_EMAIL || 'ezedinebrahim131@gmail.com');

        const { data, error } = await resend.emails.send({
          from: 'Darulkubra <onboarding@resend.dev>',
          to: [recipientEmail],
          subject: `🔐 Darulkubra Verification Code - ${schoolName}${process.env.NODE_ENV !== 'production' ? ` (${email})` : ''}`,
          html: process.env.NODE_ENV !== 'production'
            ? emailHtml.replace('Your verification code is:', `Verification code for ${email}:`)
            : emailHtml,
          reply_to: 'support@darulkubra.com'
        });

        if (error) {
          throw error;
        }

        console.log('✅ REAL EMAIL SENT SUCCESSFULLY TO:', email);
        console.log('📧 SUBJECT:', `🔐 Your Darulkubra Verification Code - ${schoolName}`);
        console.log('👤 SENDER: noreply@darulkubra.com (Darulkubra)');
        console.log('📨 RESEND ID:', data?.id);
      }

    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      // Don't send the code back in production!
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
