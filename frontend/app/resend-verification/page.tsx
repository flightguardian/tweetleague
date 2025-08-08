'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResendVerificationPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailToUse = email || session?.user?.email;
    
    if (!emailToUse) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      await api.post('/auth/resend-verification', { 
        email: emailToUse 
      });
      
      setSent(true);
      toast({
        title: 'Verification Email Sent!',
        description: 'Please check your inbox and spam folder.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send verification email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Email Sent!</h1>
          <p className="text-gray-600 mb-6">
            We've sent a verification email to <strong>{email || session?.user?.email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please check your inbox and spam folder. The link will expire in 24 hours.
          </p>
          <Link href="/">
            <Button className="w-full bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)]">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white p-6">
          <h1 className="text-2xl font-bold">Resend Verification Email</h1>
          <p className="text-sm opacity-90 mt-2">
            Haven't received your verification email? We'll send you a new one.
          </p>
        </div>

        <form onSubmit={handleResend} className="p-6 space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder={session?.user?.email || "your@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            {session?.user?.email && (
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to use {session.user.email}
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
                Sending...
              </span>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Verification Email
              </>
            )}
          </Button>

          <div className="text-center pt-4 border-t">
            <Link href="/auth" className="text-sm text-[rgb(98,181,229)] hover:underline">
              <ArrowLeft className="inline h-3 w-3 mr-1" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}