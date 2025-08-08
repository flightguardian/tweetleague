# Brevo Sender Verification Guide

## The Problem
Brevo rejects emails from unverified senders with the error:
"Sending has been rejected because the sender you used noreply@tweetleague.com is not valid"

## Quick Solution (5 minutes)

### Step 1: Add and Verify a Sender Email
1. Log into Brevo: https://app.brevo.com
2. Navigate to **Settings → Senders & IPs**
3. Click **"Add a Sender"** button
4. Enter details:
   - Name: COV Tweet League
   - Email: Use an email you have access to (e.g., your Gmail)
5. Click **Save**
6. Check that email inbox and click the verification link
7. The sender is now verified ✅

### Step 2: Update Render Environment Variable
1. Go to your Render dashboard
2. Update the environment variable:
   ```
   FROM_EMAIL=your-verified-email@gmail.com
   ```
3. Redeploy the service

## Professional Solution (Domain Authentication)

If you want to use `noreply@tweetleague.com`:

### Step 1: Authenticate Your Domain
1. In Brevo, go to **Settings → Senders & IPs → Domains**
2. Click **"Authenticate a domain"**
3. Enter: `tweetleague.com`
4. Brevo will provide DNS records:
   - SPF record
   - DKIM records (usually 3)
   - DMARC record (optional but recommended)

### Step 2: Add DNS Records
Add these records to your domain's DNS settings (wherever tweetleague.com is managed):

Example records:
```
Type: TXT
Name: @
Value: v=spf1 include:spf.brevo.com ~all

Type: TXT  
Name: mail._domainkey
Value: [DKIM value from Brevo]

Type: TXT
Name: mail2._domainkey  
Value: [DKIM value from Brevo]

Type: TXT
Name: mail3._domainkey
Value: [DKIM value from Brevo]
```

### Step 3: Verify Domain
1. Wait 5-10 minutes for DNS propagation
2. Click **"Verify"** in Brevo
3. Once verified, you can use any email @tweetleague.com

## Testing
After updating FROM_EMAIL, test by:
1. Registering a new account
2. Check if email arrives
3. Check Brevo dashboard for sending logs

## Common Issues
- **Still rejected**: Make sure FROM_EMAIL exactly matches the verified sender
- **Not receiving emails**: Check spam folder
- **DNS not verifying**: Wait up to 24 hours for propagation