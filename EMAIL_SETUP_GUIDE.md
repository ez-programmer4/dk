# Email Verification Setup Guide

## Current Status
❌ **Emails are NOT being sent** - Only logged to console for testing

## To Enable Real Email Sending

### Option 1: SendGrid (Recommended)

1. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Get API Key:**
   - Go to [SendGrid](https://sendgrid.com)
   - Create account → API Keys → Create API Key
   - Copy the API key

3. **Environment Variables:**
   ```env
   SENDGRID_API_KEY=your_actual_sendgrid_api_key
   ```

4. **Update the code:**
   ```typescript
   // In src/app/api/auth/send-verification/route.ts
   import sgMail from '@sendgrid/mail';
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

   const msg = {
     to: email,
     from: {
       email: 'noreply@darulkubra.com', // Verify this domain in SendGrid
       name: 'Darulkubra'
     },
     subject: `Verify Your Darulkubra School Registration - ${schoolName}`,
     html: emailHtmlContent,
   };

   await sgMail.send(msg);
   ```

### Option 2: AWS SES

1. **Install AWS SDK:**
   ```bash
   npm install @aws-sdk/client-ses
   ```

2. **AWS Setup:**
   - Go to AWS Console → SES → Verify domain/email
   - Create IAM user with SES permissions
   - Get access keys

3. **Environment Variables:**
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

### Option 3: Gmail (Development Only)

1. **Install Nodemailer:**
   ```bash
   npm install nodemailer
   ```

2. **Gmail Setup:**
   - Enable 2-factor authentication
   - Generate App Password: Google Account → Security → App passwords

3. **Environment Variables:**
   ```env
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   ```

## Current Sender Information

**Sender Email:** `noreply@darulkubra.com`
**Sender Name:** `Darulkubra`
**Reply-To:** User's email address (for support)

## Testing

After setup, test the verification flow:

1. Fill out registration form
2. Click "Send Verification Email"
3. Check your email inbox
4. Use the 6-digit code to complete verification

## Security Notes

- Verification codes expire in 10 minutes
- Each code can only be used once
- Rate limiting prevents spam
- Email verification prevents fake registrations

## Troubleshooting

**Email not arriving:**
- Check spam/junk folder
- Verify sender domain is authenticated
- Check email service logs
- Confirm API keys are correct

**Still need help?**
Contact the development team for email service setup assistance.
