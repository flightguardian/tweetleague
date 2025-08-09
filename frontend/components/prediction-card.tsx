'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Clock, MapPin, Calendar, Users, CheckCircle, Edit2 } from 'lucide-react';
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
  const [hasExistingPrediction, setHasExistingPrediction] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    // Set the token for API calls
    if (session?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
    }
    
    // Load existing prediction if available
    if (fixture.user_prediction && !isEditing) {
      setHomePrediction(fixture.user_prediction.home_prediction.toString());
      setAwayPrediction(fixture.user_prediction.away_prediction.toString());
      setHasExistingPrediction(true);
    }
  }, [session, fixture.user_prediction, isEditing]);

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
        description: hasExistingPrediction ? 'Prediction updated successfully!' : 'Prediction submitted successfully!',
      });
      
      // Update state to show as existing prediction
      setHasExistingPrediction(true);
      setIsEditing(false);
      
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
      <div className="flex justify-between items-start mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-100">
        {/* Left side - Date and Time stacked on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-[rgb(98,181,229)]" />
            <span>{format(new Date(fixture.kickoff_time), 'EEE, d MMM')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mt-1 sm:mt-0">
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-[rgb(98,181,229)]" />
            <span>{format(new Date(fixture.kickoff_time), 'h:mm a')}</span>
          </div>
        </div>
        {/* Right side - Entries close timer */}
        <div className="text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full bg-[rgb(98,181,229)]/10 text-[rgb(98,181,229)]">
          {timeLeft === 'Predictions closed' ? 'Entries Closed' : `Closes in ${timeLeft}`}
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
        <div className="space-y-4">
          {/* Show sign-in prompt if user is not logged in */}
          {!session && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-5 text-center">
              <p className="font-semibold text-blue-800 text-sm md:text-base mb-2">
                Sign in to make your prediction!
              </p>
              <p className="text-xs md:text-sm text-blue-700 mb-4">
                Join the community and compete for the top of the leaderboard
              </p>
              <Link href="/auth">
                <Button className="w-full md:w-auto">
                  Sign In / Sign Up
                </Button>
              </Link>
            </div>
          )}
          
          {/* Show existing prediction message if user has already predicted */}
          {session && hasExistingPrediction && !isEditing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3 mb-3">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0" />
                <p className="font-semibold text-green-800 text-sm md:text-base">
                  Your Prediction Submitted!
                </p>
              </div>
              
              {/* Prediction Display - Rebuilt for better alignment */}
              <div className="bg-white/50 rounded-lg py-3 px-4">
                <div className="flex items-center justify-center gap-4 md:gap-6">
                  {/* Home Team */}
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-600 mb-1">{fixture.home_team}</p>
                    <div className="text-2xl md:text-3xl font-bold text-green-700">
                      {homePrediction}
                    </div>
                  </div>
                  
                  {/* Dash - Properly centered */}
                  <div className="flex items-center justify-center">
                    <span className="text-xl md:text-2xl font-bold text-gray-400">-</span>
                  </div>
                  
                  {/* Away Team */}
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-600 mb-1">{fixture.away_team}</p>
                    <div className="text-2xl md:text-3xl font-bold text-green-700">
                      {awayPrediction}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-green-600 mt-3 text-center">
                ⏰ You can update until {(() => {
                  const deadline = new Date(fixture.kickoff_time);
                  deadline.setMinutes(deadline.getMinutes() - 5);
                  return format(deadline, 'h:mm a');
                })()} (5 mins before kickoff)
              </p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
              >
                <Edit2 className="h-4 w-4" />
                Change My Prediction
              </button>
            </div>
          )}
          
          {/* Prediction Form - Show when editing or no existing prediction (and user is logged in) */}
          {session && (!hasExistingPrediction || isEditing) && (
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
                
                <div className="flex items-center">
                  <div className="text-xl md:text-3xl font-bold text-gray-400 pb-2">-</div>
                </div>
                
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
              
              <div className="flex gap-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset to existing prediction
                      if (fixture.user_prediction) {
                        setHomePrediction(fixture.user_prediction.home_prediction.toString());
                        setAwayPrediction(fixture.user_prediction.away_prediction.toString());
                      }
                    }}
                    className="flex-1 text-sm md:text-base py-2 md:py-3"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="flex-1 text-sm md:text-base py-2 md:py-3" 
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : (hasExistingPrediction ? 'Update Prediction' : 'Submit Prediction')}
                </Button>
              </div>
            </form>
          )}
        </div>
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
          <div>
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
            <p className="text-xs text-gray-400 mt-1">
              Click to view all predictions{!fixture.can_predict && ' and stats'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}