'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Trophy, Target, Star, TrendingUp, Award, CheckCircle,
  User, Calendar, Activity, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  total_points: number;
  correct_scores: number;
  correct_results: number;
  predictions_made: number;
  position: number | null;
  current_streak: number;
  best_streak: number;
}

interface RecentPrediction {
  fixture_id: number;
  home_team: string;
  away_team: string;
  home_prediction: number;
  away_prediction: number;
  home_score: number | null;
  away_score: number | null;
  points_earned: number;
  kickoff_time: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<RecentPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      fetchRecentPredictions();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/users/${username}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPredictions = async () => {
    try {
      // We'll need to add this endpoint
      const response = await api.get(`/users/${username}/predictions`);
      setRecentPredictions(response.data);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(98,181,229)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">User Not Found</h2>
        <p className="text-gray-600 mt-2">The user "{username}" doesn't exist.</p>
      </div>
    );
  }

  const getPositionBadge = (position: number | null) => {
    if (!position) return null;
    
    if (position === 1) {
      return <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">🏆 Champion</div>;
    } else if (position === 2) {
      return <div className="bg-gray-400 text-white px-3 py-1 rounded-full text-sm font-bold">🥈 2nd Place</div>;
    } else if (position === 3) {
      return <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-bold">🥉 3rd Place</div>;
    } else if (position <= 10) {
      return <div className="bg-[rgb(98,181,229)] text-white px-3 py-1 rounded-full text-sm font-bold">Top 10</div>;
    }
    return null;
  };

  const successRate = profile.predictions_made > 0 
    ? Math.round(((profile.correct_scores + profile.correct_results) / profile.predictions_made) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] rounded-2xl shadow-xl p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username}
                className="w-24 h-24 rounded-full border-4 border-white/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-12 w-12 text-white/80" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold mb-2">{profile.username}</h1>
              <div className="flex items-center gap-4">
                {profile.position && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    <span className="text-xl font-semibold">#{profile.position}</span>
                  </div>
                )}
                {getPositionBadge(profile.position)}
              </div>
              <p className="text-white/80 mt-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{profile.total_points}</div>
            <div className="text-white/80">Total Points</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Star className="h-8 w-8 text-yellow-500" />
            <span className="text-3xl font-bold text-gray-800">{profile.correct_scores}</span>
          </div>
          <p className="text-gray-600">Perfect Predictions</p>
          <p className="text-xs text-gray-500 mt-1">3 points each</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <span className="text-3xl font-bold text-gray-800">{profile.correct_results}</span>
          </div>
          <p className="text-gray-600">Correct Results</p>
          <p className="text-xs text-gray-500 mt-1">1 point each</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 text-orange-500" />
            <span className="text-3xl font-bold text-gray-800">{profile.current_streak}</span>
          </div>
          <p className="text-gray-600">Current Streak</p>
          <p className="text-xs text-gray-500 mt-1">Best: {profile.best_streak} games</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-8 w-8 text-[rgb(98,181,229)]" />
            <span className="text-3xl font-bold text-gray-800">{successRate}%</span>
          </div>
          <p className="text-gray-600">Success Rate</p>
          <p className="text-xs text-gray-500 mt-1">{profile.predictions_made} predictions</p>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            Prediction Breakdown
          </h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Perfect Scores</span>
                <span className="font-semibold">{profile.correct_scores} ({profile.correct_scores * 3} pts)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-yellow-500 h-3 rounded-full"
                  style={{ width: `${profile.predictions_made > 0 ? (profile.correct_scores / profile.predictions_made) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Correct Results</span>
                <span className="font-semibold">{profile.correct_results} ({profile.correct_results} pts)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${profile.predictions_made > 0 ? (profile.correct_results / profile.predictions_made) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Wrong Predictions</span>
                <span className="font-semibold">
                  {profile.predictions_made - profile.correct_scores - profile.correct_results} (0 pts)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-400 h-3 rounded-full"
                  style={{ 
                    width: `${profile.predictions_made > 0 
                      ? ((profile.predictions_made - profile.correct_scores - profile.correct_results) / profile.predictions_made) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[rgb(98,181,229)]">
                  {profile.predictions_made > 0 ? (profile.total_points / profile.predictions_made).toFixed(1) : '0'}
                </p>
                <p className="text-sm text-gray-600">Avg Points/Game</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{profile.predictions_made}</p>
                <p className="text-sm text-gray-600">Total Games</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            Recent Predictions
          </h2>
          
          {recentPredictions.length > 0 ? (
            <div className="space-y-3">
              {recentPredictions.slice(0, 5).map((pred, idx) => (
                <div key={idx} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {pred.home_team} vs {pred.away_team}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Predicted: {pred.home_prediction}-{pred.away_prediction}
                        {pred.home_score !== null && (
                          <span className="ml-2">
                            Actual: {pred.home_score}-{pred.away_score}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      {pred.points_earned === 3 && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
                          Perfect! +3
                        </span>
                      )}
                      {pred.points_earned === 1 && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                          Correct +1
                        </span>
                      )}
                      {pred.points_earned === 0 && pred.home_score !== null && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
                          Wrong
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No predictions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}