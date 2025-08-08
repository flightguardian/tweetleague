'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Trophy, Twitter, Mail, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    twitter_handle: ''
  });

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login with email
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          toast({
            title: 'Login Failed',
            description: result.error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Welcome back!',
          });
          router.push('/');
        }
      } else {
        // Sign up with email
        const signupData: any = {
          email: formData.email,
          username: formData.username,
          password: formData.password,
        };
        
        // Only add twitter handle if provided
        if (formData.twitter_handle.trim()) {
          signupData.twitter_handle = formData.twitter_handle.replace('@', '');
        }
        
        const response = await api.post('/auth/register', signupData);
        
        if (response.data.access_token) {
          // Auto login after registration
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (result?.ok) {
            toast({
              title: 'Welcome!',
              description: 'Your account has been created successfully.',
            });
            router.push('/');
          }
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTwitterLogin = () => {
    signIn('twitter', { callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(98,181,229)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Coventry City Tweet League</h1>
          <p className="text-sm opacity-90 mt-2">
            {isLogin ? 'Welcome back, Sky Blue!' : 'Join the prediction league!'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              isLogin 
                ? 'text-[rgb(98,181,229)] border-b-2 border-[rgb(98,181,229)]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              !isLogin 
                ? 'text-[rgb(98,181,229)] border-b-2 border-[rgb(98,181,229)]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={loading}
                    minLength={3}
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                </div>

                <div>
                  <Label htmlFor="twitter_handle">
                    Twitter/X Handle 
                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <Input
                      id="twitter_handle"
                      type="text"
                      placeholder="yourhandle"
                      value={formData.twitter_handle}
                      onChange={(e) => {
                        // Remove @ if user types it
                        const value = e.target.value.replace('@', '');
                        setFormData({ ...formData, twitter_handle: value });
                      }}
                      disabled={loading}
                      maxLength={15}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Connect your Twitter handle (without the @)
                  </p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  At least 8 characters
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  {isLogin ? 'Sign In with Email' : 'Sign Up with Email'}
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleTwitterLogin}
            disabled={loading}
          >
            <Twitter className="h-4 w-4 mr-2" />
            Continue with Twitter/X
          </Button>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-[rgb(98,181,229)] hover:underline"
                onClick={() => router.push('/auth/forgot-password')}
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}