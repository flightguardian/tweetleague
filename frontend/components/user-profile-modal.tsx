'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Trophy, Target, Star, TrendingUp, Award, CheckCircle,
  User, Calendar, Activity, BarChart3, X, Clock
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
  avg_points_per_game: number;
}

interface RecentPrediction {
  fixture_id: number;
  home_team: string;
  away_team: string;
  home_prediction: number;
  away_prediction: number;
  home_score: number | null;
  away_score: number | null;
  points_earned: number | null;
  kickoff_time: string;
}

interface UserProfileModalProps {
  username: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ username, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [predictions, setPredictions] = useState<RecentPrediction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (username && isOpen) {
      fetchUserProfile();
      fetchUserPredictions();
    }
  }, [username, isOpen]);

  const fetchUserProfile = async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/users/${username}`);
      setProfile(response.data);
    } catch (error) {
      // Error fetching user profile
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPredictions = async () => {
    if (!username) return;
    
    try {
      const response = await api.get(`/users/${username}/predictions`);
      setPredictions(response.data); // Already sorted by most recent first from API
    } catch (error) {
      // Error fetching predictions
    }
  };

  const getPointsBadge = (points: number | null) => {
    if (points === null) return null;
    
    if (points === 3) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
          🎯 3 pts
        </span>
      );
    } else if (points === 1) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
          ✓ 1 pt
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
          ✗ 0 pts
        </span>
      );
    }
  };

  if (!isOpen) return null;

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

  const successRate = profile && profile.predictions_made > 0 
    ? Math.round(((profile.correct_scores + profile.correct_results) / profile.predictions_made) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : profile ? (
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Avatar */}
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-20 h-20 rounded-full border-4 border-white/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-10 w-10 text-white/80" />
                </div>
              )}
              
              {/* User Details */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{profile.username}</h2>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  {profile.position && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      <span className="text-lg font-semibold">#{profile.position}</span>
                    </div>
                  )}
                  {getPositionBadge(profile.position)}
                </div>
                <p className="text-white/80 mt-2 flex items-center justify-center md:justify-start gap-2 text-sm">
                  <Calendar className="h-3 w-3" />
                  Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-16 w-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/80">User not found</p>
            </div>
          )}
        </div>
        
        {/* Stats Grid */}
        {profile && (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {/* Total Points */}
              <div className="bg-gradient-to-br from-[rgb(98,181,229)]/10 to-[rgb(98,181,229)]/5 rounded-xl p-4 border border-[rgb(98,181,229)]/20">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="h-5 w-5 text-[rgb(98,181,229)]" />
                  <span className="text-2xl font-bold text-[rgb(98,181,229)]">{profile.total_points}</span>
                </div>
                <p className="text-xs text-gray-600">Total Points</p>
              </div>
              
              {/* Perfect Scores */}
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <Star className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{profile.correct_scores}</span>
                </div>
                <p className="text-xs text-gray-600">Perfect Scores</p>
              </div>
              
              {/* Correct Results */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-600">{profile.correct_results}</span>
                </div>
                <p className="text-xs text-gray-600">Correct Results</p>
              </div>
              
              {/* Predictions Made */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  <span className="text-2xl font-bold text-orange-600">{profile.predictions_made}</span>
                </div>
                <p className="text-xs text-gray-600">Predictions</p>
              </div>
              
              {/* Current Streak */}
              <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">{profile.current_streak}</span>
                </div>
                <p className="text-xs text-gray-600">Current Streak</p>
              </div>
              
              {/* Best Streak */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <Award className="h-5 w-5 text-indigo-600" />
                  <span className="text-2xl font-bold text-indigo-600">{profile.best_streak}</span>
                </div>
                <p className="text-xs text-gray-600">Best Streak</p>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">{successRate}%</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Avg Points</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {profile.avg_points_per_game?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            
            {/* Recent Predictions Section */}
            {predictions.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  Recent Predictions
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {predictions.map((pred) => (
                    <div key={pred.fixture_id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium truncate">{pred.home_team}</span>
                            <span className="text-gray-600 flex-shrink-0">
                              {pred.home_prediction} - {pred.away_prediction}
                            </span>
                            <span className="font-medium truncate">{pred.away_team}</span>
                          </div>
                          {pred.home_score !== null && pred.away_score !== null && (
                            <div className="text-xs text-gray-500 mt-1">
                              Actual: {pred.home_score} - {pred.away_score}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {pred.points_earned !== null ? (
                            getPointsBadge(pred.points_earned)
                          ) : (
                            <span className="text-xs text-gray-500">Pending</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {format(new Date(pred.kickoff_time), 'dd MMM yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}