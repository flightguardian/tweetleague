# Social Login Setup Guide

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret
8. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## X (Twitter) OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app in your project
3. Under "User authentication settings", click "Set up"
4. Enable OAuth 2.0
5. Set App permissions to "Read"
6. Add Callback URLs:
   - Development: `http://localhost:3000/api/auth/callback/twitter`
   - Production: `https://yourdomain.com/api/auth/callback/twitter`
7. Set Website URL: `http://localhost:3000` (or your production URL)
8. Copy the Client ID and Client Secret
9. Add to `.env.local`:
   ```
   TWITTER_CLIENT_ID=your-client-id
   TWITTER_CLIENT_SECRET=your-client-secret
   ```

## Testing Social Login

1. Restart your Next.js dev server after adding credentials
2. Click "Sign in with Google" or "Sign in with X"
3. You'll be redirected to the provider
4. After authorization, you'll be logged into the app
5. User account will be created automatically if it doesn't exist

## Notes

- Users can link multiple social accounts to the same email
- Social login users don't need a password
- Username is auto-generated from their display name
- Avatar is pulled from their social profile
- Email is automatically verified for social logins

## Troubleshooting

### "Invalid redirect URI"
- Make sure the callback URL matches exactly in your OAuth app settings
- Include the full path: `/api/auth/callback/[provider]`

### "401 Unauthorized"
- Check that your Client ID and Secret are correct
- Ensure environment variables are loaded (restart dev server)

### Users can't sign in
- Check the backend logs for errors
- Ensure the `/api/auth/social` endpoint is working
- Verify database schema includes `google_id` and `twitter_id` columns