'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Key } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast({
        title: 'Check Your Email',
        description: 'If an account exists with this email, we\'ve sent password reset instructions.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send reset email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white p-6 text-center">
            <Mail className="h-12 w-12 mx-auto mb-3" />
            <h1 className="text-2xl font-bold">Check Your Email</h1>
          </div>
          
          <div className="p-8 space-y-4">
            <p className="text-gray-600 text-center">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">📧 Important:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Check your junk/spam folder if you don't see it</li>
                <li>• The link expires in 1 hour</li>
                <li>• Only works for email-based accounts (not Twitter/Google logins)</li>
              </ul>
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">
                Didn't receive the email?
              </p>
              <Button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
              
              <Link href="/auth">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white p-6 text-center">
          <Key className="h-12 w-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Reset Your Password</h1>
          <p className="text-sm opacity-90 mt-2">
            Enter your email to receive reset instructions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              We'll send a password reset link to this email
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)]"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </Button>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Remember your password?
            </p>
            <Link href="/auth">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}