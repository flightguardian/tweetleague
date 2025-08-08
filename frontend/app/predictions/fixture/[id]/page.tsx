'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { getTeamLogo } from '@/lib/team-logos';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Target, TrendingUp, TrendingDown, Minus, Award, Users, ArrowLeft, Zap, Medal } from 'lucide-react';

interface Prediction {
  id: number;
  username: string;
  home_prediction: number;
  away_prediction: number;
  points_earned: number;
  created_at: string;
  user_position?: number;
  user_total_points?: number;
  user_form?: string; // Last 5 predictions: W (3pts), D (1pt), L (0pts)
  user_avg_points?: number;
}

interface Fixture {
  id: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  kickoff_time: string;
  competition: string;
  status: string;
  predictions_count: number;
}

export default function FixturePredictionsPage() {
  const params = useParams();
  const fixtureId = params.id;
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'points' | 'position'>('points');

  useEffect(() => {
    if (fixtureId) {
      fetchData();
    }
  }, [fixtureId]);

  const fetchData = async () => {
    try {
      // Fetch fixture details
      const fixtureResponse = await api.get(`/fixtures/${fixtureId}`);
      setFixture(fixtureResponse.data);

      // Fetch predictions with user stats
      const predictionsResponse = await api.get(`/predictions/fixture/${fixtureId}/detailed`);
      setPredictions(predictionsResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortPredictions = (preds: Prediction[]) => {
    switch (sortBy) {
      case 'points':
        return [...preds].sort((a, b) => b.points_earned - a.points_earned);
      case 'position':
        return [...preds].sort((a, b) => (a.user_position || 999) - (b.user_position || 999));
      case 'time':
        return [...preds].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      default:
        return preds;
    }
  };

  const getFormIcon = (result: string) => {
    switch (result) {
      case 'W':
        return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>;
      case 'D':
        return <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>;
      case 'L':
        return <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">0</div>;
      default:
        return <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">-</div>;
    }
  };

  const getPositionBadge = (position: number | undefined) => {
    if (!position) return null;
    
    if (position === 1) {
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    } else if (position === 2) {
      return <Medal className="h-4 w-4 text-gray-400" />;
    } else if (position === 3) {
      return <Award className="h-4 w-4 text-orange-600" />;
    } else if (position <= 10) {
      return <span className="text-xs font-bold text-green-600">#{position}</span>;
    } else {
      return <span className="text-xs text-gray-500">#{position}</span>;
    }
  };

  const getPointsBadge = (points: number) => {
    if (points === 3) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
          <Zap className="h-3 w-3" />
          <span className="text-xs font-bold">Perfect!</span>
        </div>
      );
    } else if (points === 1) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full">
          <Target className="h-3 w-3" />
          <span className="text-xs font-bold">Correct</span>
        </div>
      );
    } else {
      return (
        <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
          <span className="text-xs">No points</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(98,181,229)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading predictions...</p>
        </div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Fixture not found</p>
        </div>
      </div>
    );
  }

  const sortedPredictions = sortPredictions(predictions);
  const perfectPredictions = predictions.filter(p => p.points_earned === 3);
  const correctResults = predictions.filter(p => p.points_earned === 1);
  const averageHomeScore = predictions.length > 0 
    ? (predictions.reduce((sum, p) => sum + p.home_prediction, 0) / predictions.length).toFixed(1)
    : '0';
  const averageAwayScore = predictions.length > 0
    ? (predictions.reduce((sum, p) => sum + p.away_prediction, 0) / predictions.length).toFixed(1)
    : '0';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back button */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[rgb(98,181,229)] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {/* Fixture Header */}
      <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white rounded-2xl p-6 mb-6">
        <div className="text-center mb-4">
          <p className="text-sm opacity-90">{fixture.competition.replace('_', ' ').toUpperCase()}</p>
          <p className="text-sm opacity-90">{format(new Date(fixture.kickoff_time), 'PPP p')}</p>
        </div>
        
        <div className="flex items-center justify-center gap-4 md:gap-8">
          <div className="text-center flex-1">
            <Image 
              src={getTeamLogo(fixture.home_team)} 
              alt={fixture.home_team}
              width={80}
              height={80}
              className="mx-auto mb-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="font-semibold text-sm md:text-base">{fixture.home_team}</p>
          </div>
          
          {fixture.home_score !== null && fixture.away_score !== null ? (
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold">
                {fixture.home_score} - {fixture.away_score}
              </p>
              <p className="text-xs mt-2 opacity-90">Final Score</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold">vs</p>
              <p className="text-xs mt-2 opacity-90">Upcoming</p>
            </div>
          )}
          
          <div className="text-center flex-1">
            <Image 
              src={getTeamLogo(fixture.away_team)} 
              alt={fixture.away_team}
              width={80}
              height={80}
              className="mx-auto mb-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="font-semibold text-sm md:text-base">{fixture.away_team}</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
          <Users className="h-8 w-8 text-[rgb(98,181,229)] mx-auto mb-2" />
          <p className="text-2xl font-bold">{predictions.length}</p>
          <p className="text-xs text-gray-600">Total Predictions</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
          <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{perfectPredictions.length}</p>
          <p className="text-xs text-gray-600">Perfect Scores</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
          <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{correctResults.length}</p>
          <p className="text-xs text-gray-600">Correct Results</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
          <div className="text-3xl mb-2">⚽</div>
          <p className="text-xl font-bold">{averageHomeScore}</p>
          <p className="text-xs text-gray-600">Avg Home Score</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
          <div className="text-3xl mb-2">⚽</div>
          <p className="text-xl font-bold">{averageAwayScore}</p>
          <p className="text-xs text-gray-600">Avg Away Score</p>
        </div>
      </div>

      {/* Sort Options */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <button
            onClick={() => setSortBy('points')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'points'
                ? 'bg-[rgb(98,181,229)] text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Points Earned
          </button>
          <button
            onClick={() => setSortBy('position')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'position'
                ? 'bg-[rgb(98,181,229)] text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            League Position
          </button>
          <button
            onClick={() => setSortBy('time')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              sortBy === 'time'
                ? 'bg-[rgb(98,181,229)] text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Prediction Time
          </button>
        </div>
      </div>

      {/* Predictions List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="font-bold text-lg">All Predictions</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sortedPredictions.map((prediction, index) => (
            <div key={prediction.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* User Info */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Rank</div>
                    {getPositionBadge(prediction.user_position)}
                  </div>
                  
                  <div className="flex-1">
                    <Link 
                      href={`/user/${prediction.username}`}
                      className="font-medium text-sm md:text-base hover:text-[rgb(98,181,229)] transition-colors"
                    >
                      {prediction.username}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {prediction.user_total_points || 0} pts total
                      </span>
                      {prediction.user_avg_points && (
                        <span className="text-xs text-gray-500">
                          • {prediction.user_avg_points.toFixed(1)} avg
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prediction */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {prediction.home_prediction} - {prediction.away_prediction}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(prediction.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  
                  {fixture.home_score !== null && fixture.away_score !== null && (
                    <div>{getPointsBadge(prediction.points_earned)}</div>
                  )}
                </div>

                {/* User Form */}
                {prediction.user_form && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 mr-2">Form:</span>
                    {prediction.user_form.split('').slice(-5).map((result, i) => (
                      <div key={i}>{getFormIcon(result)}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {predictions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No predictions yet for this fixture
          </div>
        )}
      </div>
    </div>
  );
}