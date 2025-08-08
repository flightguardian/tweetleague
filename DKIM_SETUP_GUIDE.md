# DKIM Setup Guide for GoDaddy

## Overview
DKIM (DomainKeys Identified Mail) adds a digital signature to your emails to verify they haven't been tampered with and are from your domain.

## Step 1: Generate DKIM Keys (if using external service)

If you're using GoDaddy's email service directly, they handle DKIM automatically. If using external SMTP:

### For GoDaddy Professional Email:
1. Log into your GoDaddy account
2. Go to **Email & Office** → **Professional Email**
3. Click **Manage** next to your domain
4. Go to **Tools** → **Server Settings**
5. Click on **DKIM**
6. Enable DKIM signing
7. GoDaddy will provide the DKIM records to add

### For External SMTP (Gmail, SendGrid, etc.):
Your email service provider will give you DKIM records. Common providers:

#### Gmail/Google Workspace:
1. Go to Google Admin Console
2. Navigate to **Apps** → **Google Workspace** → **Gmail**
3. Click **Authenticate email**
4. Generate new record
5. You'll get something like: `google._domainkey`

#### SendGrid:
1. Go to SendGrid Settings → Sender Authentication
2. Authenticate your domain
3. SendGrid provides CNAME records for DKIM

## Step 2: Add DKIM Records to GoDaddy DNS

1. Log into GoDaddy account
2. Go to **My Products** → **Domains**
3. Click **Manage** next to tweetleague.com
4. Select **DNS** → **Manage Zones**
5. Click **Add Record**
6. Choose record type:
   - **TXT** for most providers
   - **CNAME** for SendGrid and some others

### Example DKIM Records:

#### TXT Record (most common):
- **Name**: `default._domainkey` (or provider-specific selector)
- **Value**: `v=DKIM1; k=rsa; p=MIGfMA0GCSq...` (your public key)
- **TTL**: 3600

#### CNAME Record (SendGrid example):
- **Name**: `s1._domainkey`
- **Points to**: `s1._domainkey.sendgrid.net`
- **TTL**: 3600

## Step 3: Current DNS Configuration

Based on your domain tweetleague.com, here are the records you should have:

### SPF (already configured):
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com include:secureserver.net ~all
```

### DMARC (already configured):
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@tweetleague.com; ruf=mailto:admin@tweetleague.com; fo=1
```

### DKIM (to be added):
Depends on your email provider. For GoDaddy Professional Email:
```
Type: TXT
Name: default._domainkey
Value: [Will be provided by GoDaddy]
```

## Step 4: Verify DKIM Setup

After adding records (wait 24-48 hours for propagation):

### Using Command Line:
```bash
# Check DKIM record
nslookup -type=TXT default._domainkey.tweetleague.com

# Or using dig
dig TXT default._domainkey.tweetleague.com
```

### Online Tools:
1. MXToolbox DKIM Check: https://mxtoolbox.com/dkim.aspx
2. DMARC Analyzer: https://www.dmarcanalyzer.com/dkim-check/
3. Mail-Tester: https://www.mail-tester.com/

## Step 5: Test Email Deliverability

1. Send test email to:
   - `check-auth@verifier.port25.com` (automated response with auth details)
   - Your Gmail account (check headers for DKIM pass)
   - `test@mail-tester.com` (get deliverability score)

2. Check email headers in Gmail:
   - Open the email
   - Click three dots → "Show original"
   - Look for: `DKIM: 'PASS' with domain tweetleague.com`

## Troubleshooting

### DKIM Not Passing:
- Wait 48 hours for DNS propagation
- Verify selector name matches provider's instructions
- Check for typos in the public key
- Ensure no extra spaces in TXT record

### Common Issues:
1. **Key too long**: Split into multiple strings in quotes
2. **Wrong selector**: Use provider's exact selector name
3. **TTL too high**: Start with 3600 (1 hour)

## Email Provider Specific Settings

Since you're using GoDaddy domain with external SMTP, ensure:

1. SMTP settings in `.env`:
```
SMTP_HOST=smtppro.zoho.com  # or your provider
SMTP_PORT=587
SMTP_USERNAME=noreply@tweetleague.com
SMTP_PASSWORD=your_password
FROM_EMAIL=noreply@tweetleague.com
FROM_NAME=Tweet League
```

2. If using GoDaddy's SMTP:
```
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587  # or 465 for SSL
```

## Next Steps

1. Determine your email service provider (GoDaddy, Gmail, etc.)
2. Get DKIM records from the provider
3. Add to GoDaddy DNS
4. Wait for propagation
5. Test with mail-tester.com
6. Monitor DMARC reports at admin@tweetleague.com

## Resources
- [GoDaddy DKIM Help](https://www.godaddy.com/help/add-a-dkim-record-40025)
- [Google Workspace DKIM](https://support.google.com/a/answer/174124)
- [DKIM Validator](https://www.mail-tester.com/)