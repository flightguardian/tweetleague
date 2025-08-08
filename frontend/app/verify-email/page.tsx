'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }
    
    verifyEmail(token);
  }, [searchParams]);
  
  const verifyEmail = async (token: string) => {
    try {
      const response = await api.post('/auth/verify-email', { token });
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Failed to verify email. The link may have expired.');
    }
  };
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-[rgb(98,181,229)] animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-4">Redirecting to login...</p>
              <Link href="/auth">
                <Button className="bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)]">
                  Go to Login
                </Button>
              </Link>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link href="/auth">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
                <Link href="/resend-verification">
                  <Button className="w-full bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)]">
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}