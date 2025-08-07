# Twitter/X OAuth 2.0 Setup Guide

## Overview
Twitter/X now recommends OAuth 2.0 with PKCE (Proof Key for Code Exchange) for user authentication. This is more secure and provides better user experience than OAuth 1.0a.

## OAuth 2.0 Methods Available

### 1. Bearer Token (App-Only Authentication)
- **Use case**: Read-only access to public information
- **No user context**: Cannot access private user data
- **Rate limits**: Applied at app level

### 2. OAuth 2.0 Authorization Code Flow with PKCE (Recommended)
- **Use case**: Authenticate users and access their data
- **User context**: Full access to authorized user data
- **Better UX**: Streamlined consent flow with specific scopes

## Setting Up OAuth 2.0 with PKCE

### Step 1: Create Twitter/X App

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new App or select existing one
3. Navigate to "User authentication settings"
4. Click "Set up" and configure:

```
Type of App: Web App
App permissions: Read (minimum)
Request email from users: ✓ Enabled
App info:
  - Callback URI: http://localhost:3000/api/auth/callback/twitter
  - Website URL: http://localhost:3000
```

### Step 2: Enable OAuth 2.0

In your app settings:
1. Go to "Keys and tokens" tab
2. Under "OAuth 2.0 Client ID and Client Secret":
   - Click "Regenerate" if needed
   - Save your **Client ID** and **Client Secret**

### Step 3: Configure Scopes

Available OAuth 2.0 scopes:
- `tweet.read` - Read tweets
- `users.read` - Read user profile information
- `follows.read` - Read follows
- `offline.access` - Refresh token for persistent access

For Tweet League, we only need:
- `users.read` - To get user profile info
- `tweet.read` - Optional, for future features

### Step 4: Environment Configuration

#### Frontend (.env.local)
```env
# Twitter OAuth 2.0
TWITTER_CLIENT_ID=your_oauth2_client_id_here
TWITTER_CLIENT_SECRET=your_oauth2_client_secret_here

# NextAuth configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

#### Backend (.env)
```env
# If using backend OAuth flow
TWITTER_OAUTH2_CLIENT_ID=your_oauth2_client_id_here
TWITTER_OAUTH2_CLIENT_SECRET=your_oauth2_client_secret_here
TWITTER_OAUTH2_REDIRECT_URI=http://localhost:3000/api/auth/callback/twitter
```

## Implementation with NextAuth (Already Set Up)

Your current NextAuth configuration already supports OAuth 2.0:

```typescript
// app/api/auth/[...nextauth]/route.ts
TwitterProvider({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  version: "2.0", // This uses OAuth 2.0
})
```

## OAuth 2.0 Flow Explained

1. **User clicks "Sign in with X"**
   - App redirects to Twitter authorization URL

2. **User authorizes on Twitter**
   - User sees requested scopes
   - Grants permission to your app

3. **Twitter redirects back with code**
   - Temporary authorization code sent to callback URL

4. **Exchange code for tokens**
   - App exchanges code for access token
   - Optional: Get refresh token with `offline.access` scope

5. **Access user data**
   - Use access token to make API calls
   - Token expires after 2 hours (unless refreshed)

## Testing OAuth 2.0 Integration

### Quick Test
```bash
# 1. Start your development server
npm run dev

# 2. Visit login page
open http://localhost:3000/login

# 3. Click "Sign in with X"
# 4. Authorize on Twitter
# 5. Check you're logged in
```

### Manual API Test (Bearer Token)
```bash
# Generate Bearer Token (App-Only)
curl -X POST https://api.twitter.com/oauth2/token \
  -H "Authorization: Basic $(echo -n 'API_KEY:API_SECRET' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"

# Use Bearer Token
curl "https://api.x.com/2/users/by/username/TwitterDev" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN"
```

## Production Considerations

### Security Best Practices

1. **Use PKCE**: Always use PKCE for OAuth 2.0 flows
   ```typescript
   // NextAuth handles PKCE automatically
   TwitterProvider({
     clientId: process.env.TWITTER_CLIENT_ID!,
     clientSecret: process.env.TWITTER_CLIENT_SECRET!,
     version: "2.0",
     authorization: {
       params: {
         scope: "users.read tweet.read offline.access"
       }
     }
   })
   ```

2. **Secure Storage**: Never expose tokens in frontend
3. **HTTPS Required**: Production must use HTTPS
4. **Token Refresh**: Implement refresh token rotation

### Rate Limits

OAuth 2.0 endpoints have different rate limits:
- User auth endpoints: 50 requests per 15 minutes
- App-only endpoints: Varies by endpoint
- User context endpoints: 900 requests per 15 minutes per user

### Error Handling

Common OAuth 2.0 errors:
- `invalid_request`: Missing required parameters
- `invalid_client`: Wrong Client ID/Secret
- `invalid_grant`: Authorization code expired or invalid
- `unauthorized_client`: App not authorized for this grant type

## Migration from OAuth 1.0a

If migrating from OAuth 1.0a:
1. Update environment variables to OAuth 2.0 credentials
2. Change NextAuth Twitter provider version to "2.0"
3. Update callback URLs in Twitter app settings
4. Test thoroughly with existing users

## Troubleshooting

### "Callback URL mismatch"
- Ensure callback URL matches exactly (including trailing slashes)
- Add all environment URLs (dev, staging, production)

### "Invalid client"
- Regenerate Client ID and Secret
- Check they're correctly set in environment variables

### "User denied access"
- User cancelled authorization
- Handle gracefully in your app

### Can't get email
- Enable "Request email from users" in app settings
- Add email scope to authorization request
- User must have verified email on Twitter

## Additional Resources

- [Twitter OAuth 2.0 Docs](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [PKCE Specification](https://datatracker.ietf.org/doc/html/rfc7636)
- [NextAuth Twitter Provider](https://next-auth.js.org/providers/twitter)
- [Twitter API v2 Scopes](https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code)

## Support

For Twitter/X OAuth issues:
- Twitter Developer Forums: https://twittercommunity.com
- API Status: https://api.twitterstat.us/

For NextAuth issues:
- NextAuth Discord: https://discord.gg/nextauth
- GitHub Issues: https://github.com/nextauthjs/next-auth/issues