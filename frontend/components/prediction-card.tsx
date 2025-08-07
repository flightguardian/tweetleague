'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Clock, MapPin } from 'lucide-react';
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
          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
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
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to submit prediction',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4 text-[rgb(98,181,229)]" />
          {format(new Date(fixture.kickoff_time), 'PPp')}
        </div>
        <div className="text-sm font-bold px-3 py-1 rounded-full bg-[rgb(98,181,229)]/10 text-[rgb(98,181,229)]">
          {timeLeft}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <div className="flex flex-col items-center">
            <Image 
              src={getTeamLogo(fixture.home_team)} 
              alt={fixture.home_team}
              width={80}
              height={80}
              className="mb-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h3 className="font-bold text-lg">{fixture.home_team}</h3>
            <p className="text-sm text-gray-600">Home</p>
          </div>
        </div>
        <div className="px-4">
          <p className="text-2xl font-bold text-gray-400">VS</p>
        </div>
        <div className="text-center flex-1">
          <div className="flex flex-col items-center">
            <Image 
              src={getTeamLogo(fixture.away_team)} 
              alt={fixture.away_team}
              width={80}
              height={80}
              className="mb-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h3 className="font-bold text-lg">{fixture.away_team}</h3>
            <p className="text-sm text-gray-600">Away</p>
          </div>
        </div>
      </div>

      {fixture.can_predict ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex gap-12 justify-center items-center">
            <div className="text-center">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Home Score</label>
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
                className="w-20 h-20 text-center text-4xl font-bold border-2 border-gray-200 rounded-2xl focus:border-[rgb(98,181,229)] focus:outline-none focus:ring-4 focus:ring-[rgb(98,181,229)]/20 transition-all shadow-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="mt-8">
              <span className="text-3xl font-bold text-gray-300">VS</span>
            </div>
            <div className="text-center">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Away Score</label>
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
                className="w-20 h-20 text-center text-4xl font-bold border-2 border-gray-200 rounded-2xl focus:border-[rgb(98,181,229)] focus:outline-none focus:ring-4 focus:ring-[rgb(98,181,229)]/20 transition-all shadow-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Prediction'}
          </Button>
        </form>
      ) : (
        <div className="text-center py-4 bg-gray-100 rounded">
          <p className="text-gray-600">Predictions are closed for this match</p>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          {fixture.predictions_count === 0 
            ? "Be the first to predict this match!" 
            : fixture.predictions_count === 1
            ? "1 player has predicted"
            : `${fixture.predictions_count} players have predicted`}
        </p>
        {fixture.predictions_count > 0 && !fixture.can_predict && (
          <p className="text-xs text-gray-400 mt-1">
            Predictions will be revealed after the deadline
          </p>
        )}
      </div>
    </div>
  );
}