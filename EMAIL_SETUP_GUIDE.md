# Email Verification Setup Guide

## Current Status
❌ **Emails are NOT being sent** - Currently in testing mode (console logs only)

## ✅ Enable Real Email Sending with Resend

### Why Resend?
- **3,000 free emails/month** (no credit card required)
- **Excellent deliverability**
- **Beautiful email templates**
- **Developer-friendly API**
- **Fast setup** (5 minutes)

### 🚀 Quick Setup (5 Minutes)

1. **Go to Resend:**
   - Visit [resend.com](https://resend.com)
   - Click "Sign Up" (free account)

2. **Verify Your Email:**
   - Check your email inbox
   - Click the verification link

3. **Get Your API Key:**
   - Go to "API Keys" in dashboard
   - Click "Create API Key"
   - Name it "Darulkubra Production"
   - Copy the API key (starts with `re_`)

4. **Update Environment Variables:**
   ```env
   # Add this to your .env.local file
   RESEND_API_KEY=re_1234567890abcdef
   RESEND_TEST_EMAIL=ezedinebrahim131@gmail.com  # Your Resend account email
   ```

5. **Restart Your App:**
   ```bash
   # Stop the dev server (Ctrl+C) then restart
   npm run dev
   ```

### 🧪 Test Real Email Sending

1. **Open your app:** `http://localhost:3000`
2. **Click "Start Free Trial"**
3. **Fill out the registration form:**
   - School Name: Your Test School
   - Admin Name: Your Name
   - Admin Email: **your_real_email@example.com**
4. **Click "Send Verification Email"**
5. **Check your email inbox** 📧
6. **Use the 6-digit code** to complete verification

### 📧 Email Details

**From:** `Darulkubra <onboarding@resend.dev>` *(testing) / `noreply@darulkubra.com` *(production)*
**Subject:** `🔐 Your Darulkubra Verification Code - [School Name]`
**Design:** Professional HTML template with:
- Gradient header
- Large, clear verification code
- Security notices
- Branded footer

### 🔧 Domain Verification (For Production)

**Current:** Using `onboarding@resend.dev` for immediate testing

**For Production:** To use `noreply@darulkubra.com`:

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `darulkubra.com`
4. Add the DNS records to your domain registrar
5. Wait for verification (usually 5-10 minutes)
6. Change the "From" address back to `noreply@darulkubra.com`

### 🔧 Technical Details

**Current Implementation:**
- ✅ Resend integration ready
- ✅ Beautiful HTML email templates
- ✅ 6-digit verification codes
- ✅ 10-minute expiration
- ✅ One-time use codes
- ✅ Rate limiting protection

**API Endpoints:**
- `POST /api/auth/send-verification` - Send verification email
- `POST /api/auth/verify-email` - Verify code

### 🆘 Troubleshooting

**Email not arriving?**
1. Check your spam/junk folder
2. Verify your Resend API key is correct
3. Check the console for error messages
4. Confirm your email address is valid

**API Key Issues?**
- Make sure it starts with `re_`
- Regenerate if needed in Resend dashboard
- No spaces or extra characters

**Still having issues?**
- Run: `node setup-resend.js` for setup help
- Check Resend dashboard for delivery status
- Contact Resend support if needed

### 🔒 Security Features

- **Code Expiration:** 10 minutes
- **One-time Use:** Each code works only once
- **Rate Limiting:** Prevents spam attempts
- **Secure Storage:** Codes stored server-side only
- **No Plain Text:** Never logs actual codes

### 📈 Upgrade Path

**Free Tier:** 3,000 emails/month
**Paid Plans:** From $20/month for 50,000 emails

Ready to scale? Upgrade your Resend plan when you need more emails!

---

**🎉 You're all set!** Your email verification is now live with professional email delivery.
