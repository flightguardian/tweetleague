'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { getTeamLogo } from '@/lib/team-logos';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { 
  Trophy, Target, Clock, Calendar, Edit2, Save, X, 
  CheckCircle, AlertCircle, Timer, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Award, Users
} from 'lucide-react';
import Link from 'next/link';

interface Prediction {
  id: number;
  fixture_id: number;
  home_prediction: number;
  away_prediction: number;
  points_earned: number;
  created_at: string;
  updated_at: string | null;
  fixture_home_team: string;
  fixture_away_team: string;
  fixture_kickoff: string;
  fixture_home_score: number | null;
  fixture_away_score: number | null;
}

export default function PredictionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ home: '', away: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Set the token for API calls
    if (session.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
    }
    
    fetchPredictions();
  }, [session, status, router]);

  const fetchPredictions = async () => {
    try {
      const response = await api.get('/predictions/my');
      setPredictions(response.data);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizedPredictions = {
    upcoming: predictions.filter(p => 
      p.fixture_home_score === null && 
      new Date(p.fixture_kickoff) > new Date()
    ),
    live: predictions.filter(p => 
      p.fixture_home_score === null && 
      new Date(p.fixture_kickoff) <= new Date()
    ),
    completed: predictions.filter(p => 
      p.fixture_home_score !== null
    )
  };

  const canEdit = (pred: Prediction) => {
    const kickoff = new Date(pred.fixture_kickoff);
    const deadline = new Date(kickoff.getTime() - 5 * 60000); // 5 minutes before
    return new Date() < deadline;
  };

  const handleEdit = (pred: Prediction) => {
    setEditingId(pred.fixture_id);
    setEditValues({
      home: pred.home_prediction.toString(),
      away: pred.away_prediction.toString()
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ home: '', away: '' });
  };

  const handleSaveEdit = async (fixtureId: number) => {
    const homeScore = parseInt(editValues.home);
    const awayScore = parseInt(editValues.away);
    
    if (isNaN(homeScore) || isNaN(awayScore) || 
        homeScore < 0 || homeScore > 20 || 
        awayScore < 0 || awayScore > 20) {
      toast({
        title: 'Error',
        description: 'Please enter valid scores between 0 and 20',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      await api.post('/predictions', {
        fixture_id: fixtureId,
        home_prediction: homeScore,
        away_prediction: awayScore
      });
      
      toast({
        title: 'Success',
        description: 'Prediction updated successfully!'
      });
      
      // Update local state
      setPredictions(predictions.map(p => 
        p.fixture_id === fixtureId 
          ? { ...p, home_prediction: homeScore, away_prediction: awayScore, updated_at: new Date().toISOString() }
          : p
      ));
      
      setEditingId(null);
      setEditValues({ home: '', away: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update prediction',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const [timers, setTimers] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const updateTimers = () => {
      const newTimers: { [key: number]: string } = {};
      
      // Use predictions directly instead of categorizedPredictions to avoid recreating dependency
      predictions.filter(p => 
        p.fixture_home_score === null && 
        new Date(p.fixture_kickoff) > new Date()
      ).forEach((pred) => {
        const deadline = new Date(pred.fixture_kickoff);
        deadline.setMinutes(deadline.getMinutes() - 5); // 5 minutes before kickoff
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        
        if (diff <= 0) {
          newTimers[pred.id] = 'Entries Closed';
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          if (days > 0) {
            newTimers[pred.id] = `Closes in ${days}d ${hours}h ${minutes}m`;
          } else if (hours > 0) {
            newTimers[pred.id] = `Closes in ${hours}h ${minutes}m ${seconds}s`;
          } else if (minutes > 0) {
            newTimers[pred.id] = `Closes in ${minutes}m ${seconds}s`;
          } else {
            newTimers[pred.id] = `Closes in ${seconds}s`;
          }
        }
      });
      
      setTimers(newTimers);
    };

    if (predictions.length > 0) {
      updateTimers();
      const interval = setInterval(updateTimers, 1000);
      return () => clearInterval(interval);
    }
  }, [predictions]);

  const getPointsBadge = (points: number) => {
    if (points === 3) {
      return (
        <div className="flex items-center gap-1 px-2 md:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs md:text-sm">
          <Trophy className="h-3 w-3 md:h-4 md:w-4" />
          <span className="font-bold">Perfect! +3</span>
        </div>
      );
    }
    if (points === 1) {
      return (
        <div className="flex items-center gap-1 px-2 md:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm">
          <Target className="h-3 w-3 md:h-4 md:w-4" />
          <span className="font-bold">Correct +1</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-2 md:px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs md:text-sm">
        <X className="h-3 w-3 md:h-4 md:w-4" />
        <span>No points</span>
      </div>
    );
  };

  const totalPoints = predictions.reduce((sum, p) => sum + p.points_earned, 0);
  const perfectPredictions = predictions.filter(p => p.points_earned === 3).length;
  const correctResults = predictions.filter(p => p.points_earned === 1).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(98,181,229)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Stats - matching homepage style */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl bg-gradient-to-br from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center py-6 md:py-12 px-4 md:px-8">
          <h1 className="text-2xl md:text-5xl font-black mb-2 md:mb-4 tracking-tight">
            MY PREDICTIONS
          </h1>
          <p className="text-sm md:text-lg opacity-90 max-w-2xl mx-auto">
            Track your predictions and climb the leaderboard
          </p>
          
          {predictions.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-6 md:mt-10 max-w-4xl mx-auto">
              <div className="bg-white/20 backdrop-blur rounded-lg md:rounded-xl p-3 md:p-4 hover:bg-white/30 transition-all">
                <TrendingUp className="h-6 w-6 md:h-10 md:w-10 text-cyan-300 mx-auto mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold">{totalPoints}</p>
                <p className="text-xs md:text-sm opacity-90">Total Points</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg md:rounded-xl p-3 md:p-4 hover:bg-white/30 transition-all">
                <Trophy className="h-6 w-6 md:h-10 md:w-10 text-yellow-300 mx-auto mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold">{perfectPredictions}</p>
                <p className="text-xs md:text-sm opacity-90">Perfect</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg md:rounded-xl p-3 md:p-4 hover:bg-white/30 transition-all">
                <Target className="h-6 w-6 md:h-10 md:w-10 text-green-300 mx-auto mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold">{correctResults}</p>
                <p className="text-xs md:text-sm opacity-90">Correct</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg md:rounded-xl p-3 md:p-4 hover:bg-white/30 transition-all">
                <Award className="h-6 w-6 md:h-10 md:w-10 text-purple-300 mx-auto mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold">{predictions.length}</p>
                <p className="text-xs md:text-sm opacity-90">Total</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
              Your Season Journey Starts Here! 
            </h2>
          </div>
          <div className="p-8 md:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl md:text-7xl mb-6">⚽</div>
              <h3 className="text-lg md:text-xl text-gray-700 font-semibold mb-3">
                No predictions yet this season
              </h3>
              <p className="text-gray-500 mb-8">
                The 2025/26 season is just beginning! Make your first prediction and start your journey to the top of the leaderboard.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-left p-4 bg-blue-50 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Earn Points</p>
                    <p className="text-xs text-gray-600">3 points for perfect scores, 1 for correct results</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left p-4 bg-green-50 rounded-lg">
                  <Target className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Make Predictions</p>
                    <p className="text-xs text-gray-600">Predict every Coventry City match this season</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left p-4 bg-purple-50 rounded-lg">
                  <Award className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Win Glory</p>
                    <p className="text-xs text-gray-600">Compete for the season championship</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/')}
                className="mt-8 bg-[rgb(98,181,229)] hover:bg-[rgb(78,145,183)] text-white px-8 py-2"
                size="lg"
              >
                Make Your First Prediction
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Predictions */}
          {categorizedPredictions.upcoming.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 flex items-center gap-3">
                <span className="w-1 h-6 md:h-8 bg-[rgb(98,181,229)] rounded-full"></span>
                Upcoming Matches
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {categorizedPredictions.upcoming.length}
                </span>
              </h2>
              <div className="space-y-4">
                {categorizedPredictions.upcoming.map((pred) => (
                  <div key={pred.id} className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
                    {/* Header with date and countdown - matching homepage style */}
                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4 text-[rgb(98,181,229)]" />
                          <span>{format(new Date(pred.fixture_kickoff), 'EEE, d MMM')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mt-1 sm:mt-0">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 text-[rgb(98,181,229)]" />
                          <span>{format(new Date(pred.fixture_kickoff), 'h:mm a')}</span>
                        </div>
                      </div>
                      <div className="text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full bg-[rgb(98,181,229)]/10 text-[rgb(98,181,229)]">
                        {timers[pred.id] || 'Loading...'}
                      </div>
                    </div>
                    
                    {/* Teams Display */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center flex-1">
                        <Image 
                          src={getTeamLogo(pred.fixture_home_team)} 
                          alt={pred.fixture_home_team}
                          width={60}
                          height={60}
                          className="mb-2 mx-auto md:w-16 md:h-16"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <h3 className="font-bold text-sm md:text-base">{pred.fixture_home_team}</h3>
                        <p className="text-xs text-gray-600">Home</p>
                      </div>
                      <div className="px-2 md:px-4">
                        <p className="text-lg md:text-xl font-bold text-gray-400">VS</p>
                      </div>
                      <div className="text-center flex-1">
                        <Image 
                          src={getTeamLogo(pred.fixture_away_team)} 
                          alt={pred.fixture_away_team}
                          width={60}
                          height={60}
                          className="mb-2 mx-auto md:w-16 md:h-16"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <h3 className="font-bold text-sm md:text-base">{pred.fixture_away_team}</h3>
                        <p className="text-xs text-gray-600">Away</p>
                      </div>
                    </div>
                    
                    {editingId === pred.fixture_id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-4 md:gap-12">
                          <div className="text-center">
                            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Home</label>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              value={editValues.home}
                              onChange={(e) => setEditValues({ ...editValues, home: e.target.value })}
                              className="w-16 md:w-20 mx-auto text-center text-lg md:text-xl font-bold"
                              disabled={saving}
                            />
                          </div>
                          <div className="flex items-center">
                            <div className="text-xl md:text-2xl font-bold text-gray-400 pb-2">-</div>
                          </div>
                          <div className="text-center">
                            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Away</label>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              value={editValues.away}
                              onChange={(e) => setEditValues({ ...editValues, away: e.target.value })}
                              className="w-16 md:w-20 mx-auto text-center text-lg md:text-xl font-bold"
                              disabled={saving}
                            />
                          </div>
                        </div>
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(pred.fixture_id)}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-xs md:text-sm"
                          >
                            <Save className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="text-xs md:text-sm"
                          >
                            <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Your Prediction Display */
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <p className="font-semibold text-green-800 text-sm">Your Prediction</p>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-2xl md:text-3xl font-bold text-green-700">
                            {pred.home_prediction}
                          </div>
                          <span className="text-xl font-bold text-gray-400">-</span>
                          <div className="text-2xl md:text-3xl font-bold text-green-700">
                            {pred.away_prediction}
                          </div>
                        </div>
                        {canEdit(pred) && (
                          <button
                            onClick={() => handleEdit(pred)}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                          >
                            <Edit2 className="h-4 w-4" />
                            Change Prediction
                          </button>
                        )}
                      </div>
                    )}
                    
                    {pred.updated_at && (
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Last updated: {format(new Date(pred.updated_at), 'MMM d, h:mm a')}
                      </p>
                    )}
                    
                    {/* View All Predictions Button */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <Link href={`/predictions/fixture/${pred.fixture_id}`}>
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border border-gray-200 rounded-lg transition-all group">
                          <div className="flex items-center justify-center gap-2">
                            <Users className="h-4 w-4 text-[rgb(98,181,229)]" />
                            <span className="text-sm font-medium text-gray-700">
                              View all predictions for this match
                            </span>
                            <span className="text-[rgb(98,181,229)] group-hover:translate-x-1 transition-transform">
                              →
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {session 
                              ? `See how others predicted • Filter by your leagues`
                              : `See all predictions and stats`
                            }
                          </p>
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live/In Progress */}
          {categorizedPredictions.live.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 flex items-center gap-3">
                <span className="w-1 h-6 md:h-8 bg-orange-500 rounded-full"></span>
                In Progress
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium animate-pulse">
                  {categorizedPredictions.live.length}
                </span>
              </h2>
              <div className="space-y-4">
                {categorizedPredictions.live.map((pred) => (
                  <div key={pred.id} className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
                    {/* Live Status Header */}
                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs md:text-sm font-bold">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                          LIVE
                        </span>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                          <Clock className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                          <span>Match in progress</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Teams Display */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center flex-1">
                        <Image 
                          src={getTeamLogo(pred.fixture_home_team)} 
                          alt={pred.fixture_home_team}
                          width={50}
                          height={50}
                          className="mb-2 mx-auto md:w-14 md:h-14"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <h3 className="font-bold text-sm md:text-base">{pred.fixture_home_team}</h3>
                        <p className="text-xs text-gray-600">Home</p>
                      </div>
                      <div className="px-2 md:px-4">
                        <p className="text-lg md:text-xl font-bold text-gray-400">VS</p>
                      </div>
                      <div className="text-center flex-1">
                        <Image 
                          src={getTeamLogo(pred.fixture_away_team)} 
                          alt={pred.fixture_away_team}
                          width={50}
                          height={50}
                          className="mb-2 mx-auto md:w-14 md:h-14"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <h3 className="font-bold text-sm md:text-base">{pred.fixture_away_team}</h3>
                        <p className="text-xs text-gray-600">Away</p>
                      </div>
                    </div>
                    
                    {/* Your Prediction - Locked */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="h-4 w-4 text-orange-600" />
                        <p className="font-semibold text-orange-800 text-sm">Your Prediction (Locked)</p>
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-2xl md:text-3xl font-bold text-orange-700">
                          {pred.home_prediction}
                        </div>
                        <span className="text-xl font-bold text-gray-400">-</span>
                        <div className="text-2xl md:text-3xl font-bold text-orange-700">
                          {pred.away_prediction}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Waiting for final result
                      </p>
                    </div>
                    
                    {/* View All Predictions Button */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <Link href={`/predictions/fixture/${pred.fixture_id}`}>
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border border-gray-200 rounded-lg transition-all group">
                          <div className="flex items-center justify-center gap-2">
                            <Users className="h-4 w-4 text-[rgb(98,181,229)]" />
                            <span className="text-sm font-medium text-gray-700">
                              View all predictions for this match
                            </span>
                            <span className="text-[rgb(98,181,229)] group-hover:translate-x-1 transition-transform">
                              →
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            See how others are predicting
                          </p>
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Predictions */}
          {categorizedPredictions.completed.length > 0 && (
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 flex items-center gap-3">
                <span className="w-1 h-6 md:h-8 bg-gray-400 rounded-full"></span>
                Completed Matches
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {categorizedPredictions.completed.length}
                </span>
              </h2>
              <div className="space-y-4">
                {categorizedPredictions.completed.map((pred) => (
                  <div key={pred.id} className="bg-white rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
                    {/* Header with date and result */}
                    <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                        <span>{format(new Date(pred.fixture_kickoff), 'EEE, d MMM')}</span>
                      </div>
                      <div>
                        {getPointsBadge(pred.points_earned)}
                      </div>
                    </div>
                    
                    {/* Teams and Final Score Display */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center flex-1">
                        <Image 
                          src={getTeamLogo(pred.fixture_home_team)} 
                          alt={pred.fixture_home_team}
                          width={50}
                          height={50}
                          className="mb-2 mx-auto md:w-14 md:h-14 opacity-70"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <h3 className="font-bold text-sm md:text-base text-gray-700">{pred.fixture_home_team}</h3>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{pred.fixture_home_score}</p>
                      </div>
                      <div className="px-2 md:px-4">
                        <p className="text-xs text-gray-500 mb-1">FINAL</p>
                        <p className="text-lg md:text-xl font-bold text-gray-400">-</p>
                      </div>
                      <div className="text-center flex-1">
                        <Image 
                          src={getTeamLogo(pred.fixture_away_team)} 
                          alt={pred.fixture_away_team}
                          width={50}
                          height={50}
                          className="mb-2 mx-auto md:w-14 md:h-14 opacity-70"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <h3 className="font-bold text-sm md:text-base text-gray-700">{pred.fixture_away_team}</h3>
                        <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{pred.fixture_away_score}</p>
                      </div>
                    </div>
                    
                    {/* Your Prediction vs Result */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">YOUR PREDICTION</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl md:text-2xl font-bold text-gray-700">
                              {pred.home_prediction} - {pred.away_prediction}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {pred.points_earned === 3 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              <Trophy className="h-4 w-4" />
                              <span className="text-xs font-bold">Perfect!</span>
                            </div>
                          )}
                          {pred.points_earned === 1 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              <Target className="h-4 w-4" />
                              <span className="text-xs font-bold">Correct</span>
                            </div>
                          )}
                          {pred.points_earned === 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              <X className="h-4 w-4" />
                              <span className="text-xs">Missed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* View All Predictions Button */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <Link href={`/predictions/fixture/${pred.fixture_id}`}>
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 border border-gray-200 rounded-lg transition-all group">
                          <div className="flex items-center justify-center gap-2">
                            <Users className="h-4 w-4 text-[rgb(98,181,229)]" />
                            <span className="text-sm font-medium text-gray-700">
                              View all predictions and results
                            </span>
                            <span className="text-[rgb(98,181,229)] group-hover:translate-x-1 transition-transform">
                              →
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Compare your prediction with others
                          </p>
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}