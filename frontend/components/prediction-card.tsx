'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Clock, MapPin, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { getTeamLogo } from '@/lib/team-logos';
import Image from 'next/image';

interface PredictionCardProps {
  fixture: any;
  onPredictionSubmit?: () => void;
}

export function PredictionCard({ fixture, onPredictionSubmit }: PredictionCardProps) {
  const { data: session } = useSession();
  const [homePrediction, setHomePrediction] = useState('');
  const [awayPrediction, setAwayPrediction] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    // Set the token for API calls
    if (session?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
    }
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => {
      const deadline = new Date(fixture.kickoff_time);
      deadline.setMinutes(deadline.getMinutes() - 5);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Predictions closed');
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fixture]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!homePrediction || !awayPrediction) {
      toast({
        title: 'Error',
        description: 'Please enter both scores',
        variant: 'destructive',
      });
      return;
    }
    
    const homeScore = parseInt(homePrediction);
    const awayScore = parseInt(awayPrediction);
    
    // Validate the scores are valid numbers
    if (isNaN(homeScore) || isNaN(awayScore)) {
      toast({
        title: 'Error',
        description: 'Please enter valid numbers for both scores',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate the scores are in reasonable range
    if (homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20) {
      toast({
        title: 'Error',
        description: 'Scores must be between 0 and 20',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/predictions', {
        fixture_id: fixture.id,
        home_prediction: homeScore,
        away_prediction: awayScore,
      });
      
      toast({
        title: 'Success',
        description: 'Prediction submitted successfully!',
      });
      
      if (onPredictionSubmit) {
        onPredictionSubmit();
      }
    } catch (error: any) {
      // Check if it's an email verification error
      if (error.response?.status === 403 && error.response?.data?.detail?.includes('verify your email')) {
        toast({
          title: 'Verify Email to Submit',
          description: (
            <div className="space-y-2">
              <p>Please verify your email address to submit predictions.</p>
              <p className="text-xs font-semibold">📧 Check your junk/spam folder for the verification link!</p>
            </div>
          ) as any,
          variant: 'destructive',
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              className="!border-white !text-white !bg-transparent hover:!bg-white hover:!text-red-600"
              onClick={async () => {
                try {
                  await api.post('/auth/resend-verification');
                  toast({
                    title: 'Verification Email Sent!',
                    description: 'Please check your inbox and junk/spam folder.',
                  });
                } catch (err: any) {
                  // Handle error properly
                  let errorMessage = 'Please try again from your profile page.';
                  if (err.response?.data?.detail) {
                    if (typeof err.response.data.detail === 'string') {
                      errorMessage = err.response.data.detail;
                    }
                  }
                  toast({
                    title: 'Failed to resend',
                    description: errorMessage,
                    variant: 'destructive'
                  });
                }
              }}
            >
              Resend Email
            </Button>
          ),
        });
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.detail || 'Failed to submit prediction',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-8 border border-gray-100">
      {/* Header with date and countdown */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
          <Calendar className="h-3 w-3 md:h-4 md:w-4 text-[rgb(98,181,229)]" />
          <span>{format(new Date(fixture.kickoff_time), 'EEE, d MMM')}</span>
          <Clock className="h-3 w-3 md:h-4 md:w-4 text-[rgb(98,181,229)] ml-2" />
          <span>{format(new Date(fixture.kickoff_time), 'h:mm a')}</span>
        </div>
        <div className="text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full bg-[rgb(98,181,229)]/10 text-[rgb(98,181,229)] self-start sm:self-auto">
          {timeLeft}
        </div>
      </div>
      
      {/* Teams Display - Mobile Optimized */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="text-center flex-1">
          <div className="flex flex-col items-center">
            <Image 
              src={getTeamLogo(fixture.home_team)} 
              alt={fixture.home_team}
              width={60}
              height={60}
              className="mb-2 md:w-20 md:h-20"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h3 className="font-bold text-sm md:text-lg">{fixture.home_team}</h3>
            <p className="text-xs md:text-sm text-gray-600">Home</p>
          </div>
        </div>
        <div className="px-2 md:px-4">
          <p className="text-lg md:text-2xl font-bold text-gray-400">VS</p>
        </div>
        <div className="text-center flex-1">
          <div className="flex flex-col items-center">
            <Image 
              src={getTeamLogo(fixture.away_team)} 
              alt={fixture.away_team}
              width={60}
              height={60}
              className="mb-2 md:w-20 md:h-20"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h3 className="font-bold text-sm md:text-lg">{fixture.away_team}</h3>
            <p className="text-xs md:text-sm text-gray-600">Away</p>
          </div>
        </div>
      </div>

      {fixture.can_predict ? (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
          {/* Score Inputs - Mobile Optimized */}
          <div className="flex items-center justify-center gap-4 md:gap-12">
            <div className="text-center">
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3">
                Home
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                max="20"
                value={homePrediction}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow digits
                  if (!/^\d*$/.test(val)) return;
                  
                  // Allow empty string for clearing
                  if (val === '') {
                    setHomePrediction('');
                    return;
                  }
                  
                  // Parse and validate range
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 0 && num <= 20) {
                    setHomePrediction(val);
                  }
                }}
                placeholder="0"
                disabled={loading}
                className="w-16 h-16 md:w-20 md:h-20 text-center text-2xl md:text-4xl font-bold border-2 border-gray-200 rounded-xl md:rounded-2xl focus:border-[rgb(98,181,229)] focus:outline-none focus:ring-2 md:focus:ring-4 focus:ring-[rgb(98,181,229)]/20 transition-all shadow-md md:shadow-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            
            <div className="text-xl md:text-3xl font-bold text-gray-300 mt-6 md:mt-8">-</div>
            
            <div className="text-center">
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3">
                Away
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                max="20"
                value={awayPrediction}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow digits
                  if (!/^\d*$/.test(val)) return;
                  
                  // Allow empty string for clearing
                  if (val === '') {
                    setAwayPrediction('');
                    return;
                  }
                  
                  // Parse and validate range
                  const num = parseInt(val);
                  if (!isNaN(num) && num >= 0 && num <= 20) {
                    setAwayPrediction(val);
                  }
                }}
                placeholder="0"
                disabled={loading}
                className="w-16 h-16 md:w-20 md:h-20 text-center text-2xl md:text-4xl font-bold border-2 border-gray-200 rounded-xl md:rounded-2xl focus:border-[rgb(98,181,229)] focus:outline-none focus:ring-2 md:focus:ring-4 focus:ring-[rgb(98,181,229)]/20 transition-all shadow-md md:shadow-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full text-sm md:text-base py-2 md:py-3" 
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Prediction'}
          </Button>
        </form>
      ) : (
        <div className="text-center py-3 md:py-4 bg-gray-100 rounded-lg">
          <p className="text-sm md:text-base text-gray-600">Predictions are closed for this match</p>
        </div>
      )}
      
      {/* Footer with prediction count */}
      <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-100 text-center">
        {fixture.predictions_count === 0 ? (
          <p className="text-xs md:text-sm text-gray-500">Be the first to predict!</p>
        ) : (
          <Link 
            href={`/predictions/fixture/${fixture.id}`}
            className="group inline-flex items-center gap-2 text-xs md:text-sm text-[rgb(98,181,229)] hover:text-[rgb(78,145,183)] transition-colors"
          >
            <Users className="h-4 w-4" />
            <span className="underline">
              {fixture.predictions_count === 1
                ? "1 player has predicted"
                : `${fixture.predictions_count} players predicted`}
            </span>
          </Link>
        )}
        {fixture.predictions_count > 0 && !fixture.can_predict && (
          <p className="text-xs text-gray-400 mt-1">
            View all predictions and stats
          </p>
        )}
      </div>
    </div>
  );
}