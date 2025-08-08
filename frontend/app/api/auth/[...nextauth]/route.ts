import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import CredentialsProvider from "next-auth/providers/credentials";
import { api } from "@/lib/api";

const handler = NextAuth({
  debug: true, // Enable debug mode for detailed logs
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        params: {
          scope: "users.read tweet.read",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const formData = new FormData();
          formData.append('username', credentials.email); // Backend expects 'username' field but we send email
          formData.append('password', credentials.password);
          
          const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (response.data) {
            return {
              id: response.data.user.id.toString(),
              email: response.data.user.email,
              name: response.data.user.username,
              accessToken: response.data.access_token,
              isAdmin: response.data.user.is_admin
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered:', {
        provider: account?.provider,
        user: user,
        account: account,
        profile: profile
      });
      
      if (account?.provider === "google" || account?.provider === "twitter") {
        try {
          // For Twitter OAuth 2.0, email might not be available
          // Use username@twitter.local format for Twitter users without email
          const twitterUsername = (profile as any)?.data?.username;
          const email = user.email || (twitterUsername ? `${twitterUsername}@twitter.local` : `${account.providerAccountId}@twitter.local`);
          const name = user.name || profile?.name || 'Twitter User';
          
          console.log('Sending social auth request:', {
            provider: account.provider,
            provider_id: account.providerAccountId,
            email: email,
            name: name,
            avatar_url: user.image,
            twitter_handle: twitterUsername
          });
          
          const response = await api.post('/auth/social', {
            provider: account.provider,
            provider_id: account.providerAccountId,
            email: email,
            name: name,
            avatar_url: user.image,
            twitter_handle: account.provider === "twitter" ? twitterUsername : undefined
          });
          
          user.id = response.data.user.id.toString();
          user.accessToken = response.data.access_token;
          user.isAdmin = response.data.user.is_admin;
          user.email = email; // Ensure email is set
          return true;
        } catch (error) {
          console.error('Social auth error details:', error);
          console.error('Error response:', error.response?.data);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
});

export { handler as GET, handler as POST };