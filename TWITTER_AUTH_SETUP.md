# Setting up Sign in with X (Twitter) Authentication

## Prerequisites
You need a Twitter/X Developer account. If you don't have one:
1. Go to https://developer.twitter.com
2. Sign up for a developer account
3. Create a new App in the developer portal

## Step 1: Create a Twitter App

1. Go to https://developer.twitter.com/en/apps
2. Click "Create App" or "Add App"
3. Fill in the required information:
   - **App name**: CCFC Tweet League (or your chosen name)
   - **Application description**: Football prediction league for Coventry City fans
   - **Website URL**: https://yourdomain.com (or http://localhost:3000 for development)
   - **Callback URLs**: 
     - For development: `http://localhost:3000/api/auth/callback/twitter`
     - For production: `https://yourdomain.com/api/auth/callback/twitter`

## Step 2: Configure App Permissions

1. In your app settings, go to "User authentication settings"
2. Click "Set up" or "Edit"
3. Configure the following:
   - **App permissions**: Read (minimum) or Read and write
   - **Type of App**: Web App, Automated App or Bot
   - **App info**:
     - Callback URI: `http://localhost:3000/api/auth/callback/twitter` (development)
     - Website URL: Your website URL
     - Terms of service: Optional
     - Privacy policy: Optional

4. **IMPORTANT**: Enable "Request email from users" if you want to get user emails

5. Save your changes

## Step 3: Get Your API Keys

1. Go to the "Keys and tokens" tab
2. You'll need:
   - **API Key** (also called Consumer Key)
   - **API Key Secret** (also called Consumer Secret)
   - For OAuth 2.0: **Client ID** and **Client Secret**

## Step 4: Configure Environment Variables

### For NextAuth (Frontend) - OAuth 2.0
Add to your `.env.local` file:
```env
TWITTER_CLIENT_ID=your_oauth2_client_id_here
TWITTER_CLIENT_SECRET=your_oauth2_client_secret_here
```

### For Custom OAuth 1.0a Implementation (Backend)
Add to your backend `.env` file:
```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_key_secret_here
TWITTER_CALLBACK_URL=http://localhost:3000/api/auth/callback/twitter
```

## Step 5: Enable "Sign in with Twitter/X"

In your Twitter App settings:
1. Go to "User authentication settings"
2. Make sure "Allow this app to be used to Sign in with Twitter" is **enabled**
3. Save changes

## Testing the Integration

1. Start your development servers:
   ```bash
   # Backend
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   
   # Frontend
   cd frontend
   npm run dev
   ```

2. Visit http://localhost:3000/login
3. Click "Sign in with X"
4. You should be redirected to Twitter to authorize
5. After authorization, you'll be redirected back and logged in

## Common Issues and Solutions

### "Callback URL not approved"
- Make sure your callback URL in the app settings exactly matches what you're using
- Include both http://localhost:3000 and your production URL in the approved list

### "Desktop applications only support the oauth_callback value 'oob'"
- Make sure you selected "Web App" in the app type settings
- Ensure you're using the correct callback URL format

### Can't get user email
- Enable "Request email from users" in app permissions
- User must have a verified email on Twitter
- User must grant email permission during authorization

### Rate Limiting
- Twitter has rate limits on authentication endpoints
- In development, you might hit these limits with frequent testing
- Wait a few minutes if you get rate limit errors

## Production Deployment

When deploying to production:

1. Update your Twitter App settings:
   - Add production callback URL: `https://yourdomain.com/api/auth/callback/twitter`
   - Update website URL to your production domain

2. Update environment variables on your production server:
   ```env
   TWITTER_CLIENT_ID=your_production_client_id
   TWITTER_CLIENT_SECRET=your_production_client_secret
   TWITTER_CALLBACK_URL=https://yourdomain.com/api/auth/callback/twitter
   ```

3. Ensure HTTPS is enabled (Twitter requires HTTPS for production OAuth)

## Security Best Practices

1. **Never commit API keys to git**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Use different apps for development and production**
   - Create separate Twitter apps for dev/staging/production
   - This prevents development testing from affecting production

3. **Regularly rotate your keys**
   - Regenerate API keys periodically
   - Update them in your environment variables

4. **Monitor usage**
   - Check your Twitter app analytics
   - Watch for unusual authentication patterns

## Additional Features

### Getting User Profile Data
The integration automatically fetches:
- Username (handle)
- Display name
- Profile picture
- Email (if permission granted)

### Linking Accounts
Users can link their Twitter account to an existing email account through the profile settings.

### Handling Existing Users
- If a user signs in with Twitter and their email already exists, accounts are automatically linked
- Users can have multiple social logins linked to one account

## Support

For Twitter/X API issues:
- Developer Forums: https://twittercommunity.com
- API Documentation: https://developer.twitter.com/en/docs

For app-specific issues:
- Check the backend logs for OAuth errors
- Verify all environment variables are set correctly
- Ensure callback URLs match exactly