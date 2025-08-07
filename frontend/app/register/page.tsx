'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { PasswordStrength } from '@/components/password-strength';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    
    // Check for common typos
    if (email.endsWith('@gmial.com') || email.endsWith('@gmai.com')) {
      setErrors(prev => ({ ...prev, email: 'Did you mean @gmail.com?' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validateUsername = (username: string): boolean => {
    if (username.length < 3) {
      setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
      return false;
    }
    
    if (username.length > 20) {
      setErrors(prev => ({ ...prev, username: 'Username must be less than 20 characters' }));
      return false;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setErrors(prev => ({ ...prev, username: 'Username can only contain letters, numbers, underscores, and hyphens' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, username: '' }));
    return true;
  };

  const validatePassword = (password: string): boolean => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)
    };
    
    const allValid = Object.values(checks).every(Boolean);
    
    if (!allValid) {
      setErrors(prev => ({ ...prev, password: 'Password does not meet all requirements' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate all fields
    const isEmailValid = validateEmail(formData.email);
    const isUsernameValid = validateUsername(formData.username);
    const isPasswordValid = validatePassword(formData.password);
    
    if (!isEmailValid || !isUsernameValid || !isPasswordValid) {
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        username: formData.username,
        password: formData.password
      });
      
      // Store token
      localStorage.setItem('token', response.data.access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      
      setEmailSent(true);
      
      toast({
        title: 'Account created successfully!',
        description: 'Please check your email to verify your account.',
      });
      
      // Don't auto-redirect - let user see the email confirmation message
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
      
      // Handle specific error messages
      if (errorMessage.includes('Email already registered')) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered. Please login or use a different email.' }));
      } else if (errorMessage.includes('Username already taken')) {
        setErrors(prev => ({ ...prev, username: 'This username is already taken. Please choose another.' }));
      } else if (errorMessage.includes('Too many attempts')) {
        toast({
          title: 'Too many attempts',
          description: 'Please wait a moment before trying again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Registration failed',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Check Your Email!</h1>
          <p className="text-gray-600 mb-6">
            We've sent a verification link to:
          </p>
          <p className="font-medium text-lg mb-6">{formData.email}</p>
          <p className="text-sm text-gray-500 mb-6">
            Please click the link in the email to verify your account. The link will expire in 24 hours.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-4">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Can't find the email? Check your spam folder or request a new verification email.
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            <strong>Development Mode:</strong> Check your backend console for the verification link!
          </div>
          <div className="mt-6">
            <Link href="/login" className="text-[rgb(98,181,229)] hover:underline">
              Go to Login Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">
          Join the League
        </h1>
        <p className="text-center text-gray-600 mb-6">Create your CCFC Tweet League account</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                if (e.target.value) validateEmail(e.target.value);
              }}
              onBlur={() => validateEmail(formData.email)}
              placeholder="your@email.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <Input
              type="text"
              required
              value={formData.username}
              onChange={(e) => {
                setFormData({...formData, username: e.target.value});
                if (e.target.value) validateUsername(e.target.value);
              }}
              onBlur={() => validateUsername(formData.username)}
              placeholder="Choose a username"
              className={errors.username ? 'border-red-500' : ''}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
            {!errors.username && formData.username && (
              <p className="text-green-600 text-xs mt-1">Username available</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({...formData, password: e.target.value});
                  if (e.target.value) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(formData.password)}
                placeholder="Create a strong password"
                className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={formData.password} />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({...formData, confirmPassword: e.target.value});
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                placeholder="Confirm your password"
                className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
            {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-green-600 text-xs mt-1">Passwords match</p>
            )}
          </div>
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || Object.values(errors).some(Boolean)}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>
        </form>
        
        <div className="my-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn('google', { callbackUrl: '/' })}
          >
            <FaGoogle className="mr-2 h-4 w-4" />
            Sign up with Google
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn('twitter', { callbackUrl: '/' })}
          >
            <FaXTwitter className="mr-2 h-4 w-4" />
            Sign up with X
          </Button>
        </div>
        
        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-[rgb(98,181,229)] hover:underline font-semibold">
            Login here
          </Link>
        </p>
        
        <p className="text-center mt-4 text-xs text-gray-500">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}