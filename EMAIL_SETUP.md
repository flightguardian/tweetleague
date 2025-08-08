# Email Service Setup Guide

## Recommended Free Email Services

### Option 1: Brevo (Recommended for starting)
- **Free tier**: 300 emails/day
- **Website**: https://www.brevo.com
- **Setup**:
  1. Sign up at https://www.brevo.com
  2. Verify your email
  3. **IMPORTANT: Verify a sender email**:
     - Go to Settings → Senders & IPs
     - Click "Add a Sender"
     - Add and verify an email you control
  4. Go to SMTP & API → SMTP tab
  5. Generate an SMTP key
  6. Update your environment variables:
     ```
     SMTP_HOST=smtp-relay.brevo.com
     SMTP_PORT=587
     SMTP_USERNAME=YOUR_BREVO_LOGIN_EMAIL
     SMTP_PASSWORD=YOUR_SMTP_KEY
     FROM_EMAIL=your-verified-sender@email.com  # MUST be verified in Brevo!
     FROM_NAME=COV Tweet League
     ```

### Option 2: Resend (Simple setup)
- **Free tier**: 3000 emails/month (100/day)
- **Website**: https://resend.com
- **Setup**:
  1. Sign up at https://resend.com
  2. Get your API key
  3. We'll need to modify the code to use their API instead of SMTP

### Option 3: SendGrid
- **Free tier**: 100 emails/day forever
- **Website**: https://sendgrid.com
- **Setup**:
  1. Sign up at https://sendgrid.com
  2. Verify your email and sender identity
  3. Create an API key with "Mail Send" permissions
  4. Update environment variables:
     ```
     SMTP_HOST=smtp.sendgrid.net
     SMTP_PORT=587
     SMTP_USERNAME=apikey
     SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
     FROM_EMAIL=noreply@tweetleague.com
     FROM_NAME=COV Tweet League
     ```

### Option 4: Mailgun
- **Free tier**: 1000 emails/month for 3 months (then paid)
- **Website**: https://www.mailgun.com

### Option 5: Amazon SES
- **Free tier**: 62,000 emails/month if sending from EC2
- **Cost**: $0.10 per 1000 emails otherwise
- **Note**: Requires domain verification

## For 1000 emails/day needs:

If you need 1000 emails/day specifically, you have a few options:

1. **Brevo Pro** - $25/month for 20,000 emails/month
2. **SendGrid Essentials** - $19.95/month for 50,000 emails/month  
3. **Amazon SES** - Pay as you go at $0.10 per 1000 emails (so ~$3/month for 1000/day)
4. **Postmark** - $15/month for 10,000 emails

## Domain Verification

Most services will require you to verify your domain (tweetleague.com) to improve deliverability:
1. Add SPF record: `v=spf1 include:spf.brevo.com ~all`
2. Add DKIM records (provided by the service)
3. Add DMARC record (optional but recommended)

## Testing

After setting up, test with:
1. Sign up a new account
2. Check logs for any errors
3. Verify email arrives in inbox (not spam)