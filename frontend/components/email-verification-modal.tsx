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
      // Handle error properly - check if it's an object or string
      let errorMessage = 'Failed to resend email';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail[0]?.msg || errorMessage;
        }
      }
      toast({
        title: 'Error',
        description: errorMessage,
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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[rgb(98,181,229)] flex-shrink-0" />
            <span className="truncate">Verify Your Email</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Please verify your email address to submit predictions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 mt-3 overflow-y-auto max-h-[60vh]">
          <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm min-w-0 flex-1">
              <p className="font-semibold text-amber-900 mb-0.5 sm:mb-1 break-words">
                Email verification required
              </p>
              <p className="text-amber-800 break-words leading-relaxed">
                You won't be able to submit predictions until verified.
              </p>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm text-gray-600 break-words leading-relaxed">
              We sent a verification email to your registered address. Check your inbox to activate your account.
            </p>
            
            <div className="p-2.5 sm:p-3 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm font-semibold text-blue-900 flex items-start gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base flex-shrink-0 mt-0.5">📧</span>
                <span className="break-words flex-1">Don't see it? Check your junk/spam folder!</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              onClick={handleResendEmail}
              disabled={loading}
              className="w-full sm:flex-1 bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)] text-xs sm:text-sm py-2 sm:py-2.5 h-auto"
            >
              {loading ? 'Sending...' : 'Resend Email'}
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              className="w-full sm:flex-1 text-xs sm:text-sm py-2 sm:py-2.5 h-auto"
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-[10px] sm:text-xs text-center text-gray-500 break-words mt-1">
            You can resend from your profile anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}