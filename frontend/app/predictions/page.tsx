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
  TrendingUp, TrendingDown, Minus, Award
} from 'lucide-react';

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

  const getTimeUntilKickoff = (kickoffTime: string) => {
    const kickoff = new Date(kickoffTime);
    const now = new Date();
    const diff = kickoff.getTime() - now.getTime();
    
    if (diff <= 0) return 'In Progress';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

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
              <div className="bg-white rounded-xl shadow-lg divide-y divide-gray-200">
                {categorizedPredictions.upcoming.map((pred) => (
                  <div key={pred.id} className="p-3 hover:bg-gray-50 transition-colors">
                    {/* Mobile Compact Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-gray-600">
                        <div>{format(new Date(pred.fixture_kickoff), 'EEE, MMM d')}</div>
                        <div className="font-medium">{format(new Date(pred.fixture_kickoff), 'h:mm a')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-blue-600">
                          {getTimeUntilKickoff(pred.fixture_kickoff)}
                        </div>
                        {canEdit(pred) && editingId !== pred.fixture_id && (
                          <button
                            onClick={() => handleEdit(pred)}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                          >
                            <Edit2 className="h-3 w-3 inline mr-1" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {editingId === pred.fixture_id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 md:gap-4">
                          <div className="flex-1 text-center">
                            <Image 
                              src={getTeamLogo(pred.fixture_home_team)} 
                              alt={pred.fixture_home_team}
                              width={40}
                              height={40}
                              className="mx-auto mb-1 md:mb-2 w-10 h-10 md:w-12 md:h-12"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <p className="text-xs md:text-sm font-medium mb-1 md:mb-2">{pred.fixture_home_team}</p>
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
                          <div className="text-xl md:text-2xl font-bold text-gray-400">-</div>
                          <div className="flex-1 text-center">
                            <Image 
                              src={getTeamLogo(pred.fixture_away_team)} 
                              alt={pred.fixture_away_team}
                              width={40}
                              height={40}
                              className="mx-auto mb-1 md:mb-2 w-10 h-10 md:w-12 md:h-12"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <p className="text-xs md:text-sm font-medium mb-1 md:mb-2">{pred.fixture_away_team}</p>
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
                      /* Compact Prediction Display */
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 text-center">
                          <p className="text-xs font-medium text-gray-600 truncate">{pred.fixture_home_team}</p>
                          <p className="text-lg font-bold">{pred.home_prediction}</p>
                        </div>
                        <div className="text-gray-400 font-bold">-</div>
                        <div className="flex-1 text-center">
                          <p className="text-xs font-medium text-gray-600 truncate">{pred.fixture_away_team}</p>
                          <p className="text-lg font-bold">{pred.away_prediction}</p>
                        </div>
                      </div>
                    )}
                    
                    {pred.updated_at && (
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Last updated: {format(new Date(pred.updated_at), 'MMM d, h:mm a')}
                      </p>
                    )}
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
              <div className="bg-white rounded-xl shadow-lg divide-y divide-gray-200">
                {categorizedPredictions.live.map((pred) => (
                  <div key={pred.id} className="p-3 bg-orange-50/50 hover:bg-orange-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        LIVE
                      </span>
                      <span className="text-xs text-gray-500">Locked</span>
                    </div>
                    
                    {/* Compact Score Display */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 text-center">
                        <p className="text-xs font-medium text-gray-600 truncate">{pred.fixture_home_team}</p>
                        <p className="text-lg font-bold">{pred.home_prediction}</p>
                      </div>
                      <div className="text-gray-400 font-bold">-</div>
                      <div className="flex-1 text-center">
                        <p className="text-xs font-medium text-gray-600 truncate">{pred.fixture_away_team}</p>
                        <p className="text-lg font-bold">{pred.away_prediction}</p>
                      </div>
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
              <div className="bg-white rounded-xl shadow-lg divide-y divide-gray-200">
                {categorizedPredictions.completed.map((pred) => (
                  <div key={pred.id} className="p-3 hover:bg-gray-50 transition-colors">
                    {/* Compact Header with Date and Points */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-gray-600">
                        {format(new Date(pred.fixture_kickoff), 'MMM d')}
                      </div>
                      <div>
                        {pred.points_earned === 3 ? (
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Perfect +3
                          </span>
                        ) : pred.points_earned === 1 ? (
                          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            Correct +1
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            0 pts
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Compact Score Display */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 text-center">
                        <p className="text-xs font-medium text-gray-600 truncate">{pred.fixture_home_team}</p>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg font-bold">{pred.home_prediction}</span>
                          <span className="text-xs text-gray-500">({pred.fixture_home_score})</span>
                        </div>
                      </div>
                      <div className="text-gray-400 font-bold">-</div>
                      <div className="flex-1 text-center">
                        <p className="text-xs font-medium text-gray-600 truncate">{pred.fixture_away_team}</p>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-lg font-bold">{pred.away_prediction}</span>
                          <span className="text-xs text-gray-500">({pred.fixture_away_score})</span>
                        </div>
                      </div>
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