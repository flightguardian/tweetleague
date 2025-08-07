'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Trophy, Medal, Award } from 'lucide-react';
import Link from 'next/link';
import { getSeasonParams } from '@/lib/season-context';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const seasonParams = getSeasonParams();
      const response = await api.get('/leaderboard', {
        params: { limit: 100, ...seasonParams }
      });
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />;
      default:
        return <span className="text-sm md:text-lg font-medium">{position}</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">Season Leaderboard</h1>
        <p className="text-gray-600 text-sm md:text-base">Track the best predictors in the Sky Blues community</p>
      </div>
      
      {/* Mobile View - Card Layout */}
      <div className="md:hidden space-y-3">
        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            No predictions made yet. Be the first to predict!
          </div>
        ) : (
          leaderboard.map((player, index) => (
            <div 
              key={player.username} 
              className={`bg-white rounded-lg p-4 shadow-lg border ${
                index < 3 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getPositionIcon(player.position)}
                  </div>
                  <Link 
                    href={`/user/${player.username}`}
                    className="font-bold text-gray-800 hover:text-[rgb(98,181,229)]"
                  >
                    {player.username}
                  </Link>
                </div>
                <div className="text-2xl font-bold text-[rgb(98,181,229)]">
                  {player.total_points}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-500">Perfect</div>
                  <div className="font-semibold">{player.correct_scores}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Correct</div>
                  <div className="font-semibold">{player.correct_results}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Played</div>
                  <div className="font-semibold">{player.predictions_made}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Avg</div>
                  <div className="font-semibold">{player.avg_points_per_game.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View - Table with horizontal scroll */}
      <div className="hidden md:block bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(78,145,183)] text-white">
              <tr>
                <th className="px-4 py-3 text-left whitespace-nowrap">Pos</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Points</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Perfect</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Correct</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Played</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Avg</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No predictions made yet. Be the first to predict!
                  </td>
                </tr>
              ) : (
                leaderboard.map((player, index) => (
                  <tr key={player.username} className={`border-b ${index < 3 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {getPositionIcon(player.position)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link 
                        href={`/user/${player.username}`}
                        className="hover:text-[rgb(98,181,229)] transition-colors"
                      >
                        {player.username}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-lg">{player.total_points}</td>
                    <td className="px-4 py-3 text-center">{player.correct_scores}</td>
                    <td className="px-4 py-3 text-center">{player.correct_results}</td>
                    <td className="px-4 py-3 text-center">{player.predictions_made}</td>
                    <td className="px-4 py-3 text-center">{player.avg_points_per_game.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Scoring System - Mobile Responsive */}
      <div className="mt-6 bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
        <h2 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[rgb(98,181,229)] rounded-full"></span>
          Scoring System
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
            <div className="text-xl md:text-2xl mb-1">🎯</div>
            <div className="font-bold text-green-800 text-sm md:text-base">Perfect Score</div>
            <div className="text-xl md:text-2xl font-bold text-green-600">3 points</div>
          </div>
          <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
            <div className="text-xl md:text-2xl mb-1">✅</div>
            <div className="font-bold text-blue-800 text-sm md:text-base">Correct Result</div>
            <div className="text-xl md:text-2xl font-bold text-blue-600">1 point</div>
          </div>
        </div>
      </div>
    </div>
  );
}