# Tweet League Deployment Guide

## 🚀 Deploying to Render

### Prerequisites
1. Create accounts on:
   - [Render.com](https://render.com)
   - [Google Cloud Console](https://console.cloud.google.com) (for OAuth)
   - [Twitter Developer Portal](https://developer.twitter.com) (for OAuth)

### Step 1: Deploy Backend to Render

1. **Create a new Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory as root directory

2. **Configure the Backend Service:**
   - **Name:** `tweetleague-backend`
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `./build.sh`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables:**
   ```
   DATABASE_URL=<your-postgres-url>  # Render provides this
   SECRET_KEY=<generate-with-openssl-rand-hex-32>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=43200
   FRONTEND_URL=https://your-domain.com
   ```

4. **Optional Email Variables (for password reset):**
   ```
   EMAIL_FROM=noreply@your-domain.com
   EMAIL_FROM_NAME=Tweet League
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

### Step 2: Deploy Frontend to Render

1. **Create another Web Service:**
   - Click "New +" → "Web Service"
   - Connect the same repository
   - Select the `frontend` directory

2. **Configure the Frontend Service:**
   - **Name:** `tweetleague-frontend`
   - **Region:** Same as backend
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

3. **Add Environment Variables:**
   ```
   NODE_VERSION=20.11.0
   NEXT_PUBLIC_API_URL=https://tweetleague-backend.onrender.com/api
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
   GOOGLE_CLIENT_ID=<from-google-cloud-console>
   GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
   TWITTER_CLIENT_ID=<from-twitter-developer-portal>
   TWITTER_CLIENT_SECRET=<from-twitter-developer-portal>
   ```

## 🔐 Setting up OAuth

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Add authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local dev)

### Twitter/X OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create a new app or select existing
3. Go to "User authentication settings"
4. Enable OAuth 2.0
5. Set App permissions: "Read"
6. Add callback URLs:
   - `https://your-domain.com/api/auth/callback/twitter`
   - `http://localhost:3000/api/auth/callback/twitter`
7. Save your Client ID and Client Secret

## 🌐 GoDaddy Domain Configuration

### Connect your domain to Render:

1. **In Render Dashboard:**
   - Go to your frontend service
   - Click "Settings" → "Custom Domains"
   - Add your domain: `your-domain.com` and `www.your-domain.com`
   - Render will provide DNS records

2. **In GoDaddy Domain Manager:**

   **For root domain (your-domain.com):**
   - Go to DNS Management
   - Find or create an "A" record:
     - Type: A
     - Name: @
     - Value: (Render will provide an IP address)
     - TTL: 600 seconds

   **For www subdomain:**
   - Create a CNAME record:
     - Type: CNAME
     - Name: www
     - Value: `your-frontend-service.onrender.com`
     - TTL: 600 seconds

   **Alternative: Use GoDaddy Forwarding:**
   - You can also use domain forwarding to redirect to your Render URL
   - Go to "Forwarding" in GoDaddy
   - Forward to: `https://your-frontend-service.onrender.com`

3. **SSL Certificate:**
   - Render automatically provisions SSL certificates
   - Wait 10-30 minutes for DNS propagation

## 📝 Post-Deployment Checklist

- [ ] Backend is accessible at `https://tweetleague-backend.onrender.com`
- [ ] Frontend is accessible at your custom domain
- [ ] Google OAuth login works
- [ ] Twitter/X OAuth login works
- [ ] Database migrations ran successfully
- [ ] SSL certificate is active (https:// works)
- [ ] CORS is configured correctly
- [ ] Environment variables are set correctly

## 🔧 Troubleshooting

### Common Issues:

1. **CORS errors:**
   - Ensure `FRONTEND_URL` env var in backend matches your domain
   - Check that API calls use the correct backend URL

2. **OAuth redirect errors:**
   - Update redirect URIs in Google/Twitter consoles
   - Ensure `NEXTAUTH_URL` matches your domain

3. **Database connection issues:**
   - Check `DATABASE_URL` format
   - Ensure database is provisioned on Render

4. **Build failures:**
   - Check logs in Render dashboard
   - Ensure all dependencies are in requirements.txt/package.json

## 🚨 Important Security Notes

1. **Never commit .env files to git**
2. **Generate strong secrets:**
   ```bash
   # For SECRET_KEY
   openssl rand -hex 32
   
   # For NEXTAUTH_SECRET
   openssl rand -base64 32
   ```
3. **Use environment variables for all sensitive data**
4. **Enable 2FA on all service accounts**

## 📞 Support

If you encounter issues:
1. Check Render logs: Dashboard → Service → Logs
2. Verify environment variables are set
3. Ensure DNS has propagated (can take up to 48 hours)
4. Check browser console for errors

---

## Quick Commands Reference

```bash
# Generate secrets
openssl rand -hex 32    # For backend SECRET_KEY
openssl rand -base64 32  # For NEXTAUTH_SECRET

# Test API endpoint
curl https://tweetleague-backend.onrender.com/api/health

# Check DNS propagation
nslookup your-domain.com
```