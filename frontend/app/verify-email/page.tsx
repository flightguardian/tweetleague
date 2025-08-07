'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('No verification token provided');
      setVerifying(false);
      return;
    }
    
    verifyEmail(token);
  }, [searchParams]);
  
  const verifyEmail = async (token: string) => {
    try {
      await api.post('/auth/verify-email', { token });
      setVerified(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Verification failed';
      setError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };
  
  if (verifying) {
    return (
      <div className="max-w-md mx-auto mt-24">
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100 text-center">
          <Loader className="h-16 w-16 text-[rgb(98,181,229)] mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
          <p className="text-gray-600">Please wait while we verify your email address</p>
        </div>
      </div>
    );
  }
  
  if (verified) {
    return (
      <div className="max-w-md mx-auto mt-24">
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-6">
            Your email has been successfully verified. You can now log in to your account.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto mt-24">
      <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100 text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        
        {error.includes('expired') && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Your verification link has expired. Please request a new one.
            </p>
            <Button asChild className="w-full">
              <Link href="/resend-verification">Request New Verification Email</Link>
            </Button>
          </div>
        )}
        
        <div className="mt-6 space-y-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto mt-24">
        <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100 text-center">
          <Loader className="h-16 w-16 text-[rgb(98,181,229)] mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}