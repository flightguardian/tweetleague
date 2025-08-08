'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function EmailVerificationModal() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    if (session?.accessToken && !userChecked) {
      checkEmailVerification();
    }
  }, [session, userChecked]);

  const checkEmailVerification = async () => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${session?.accessToken}`;
      const response = await api.get('/users/me');
      
      // Show modal if email is not verified and hasn't been dismissed this session
      if (!response.data.email_verified) {
        const dismissed = sessionStorage.getItem('email-verification-dismissed');
        if (!dismissed) {
          setIsOpen(true);
        }
      }
      setUserChecked(true);
    } catch (error) {
      console.error('Failed to check email verification:', error);
      setUserChecked(true);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-verification');
      toast({
        title: 'Email Sent!',
        description: 'Please check your inbox and junk/spam folder.',
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to resend email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem('email-verification-dismissed', 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[rgb(98,181,229)]" />
            Verify Your Email
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 mb-1">
                Email verification required
              </p>
              <p className="text-amber-800">
                You won't be able to submit predictions until your email is verified.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              We sent a verification email to your registered address. Please check your inbox to activate your account.
            </p>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <span className="text-lg">📧</span>
                Don't see it? Check your junk/spam folder!
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleResendEmail}
              disabled={loading}
              className="flex-1 bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)]"
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            You can resend the verification email from your profile anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}