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
    <div className="max-w-5xl mx-auto px-4 md:px-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-3">Season Leaderboard</h1>
        <p className="text-gray-600 text-sm md:text-base">Track the best predictors in the Sky Blues community</p>
      </div>
      
      {/* Table with horizontal scroll and sticky header */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl border border-gray-100 overflow-hidden">
        {/* Wrapper for horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(78,145,183)] text-white sticky top-0 z-10">
              <tr>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold sticky left-0 bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(98,181,229)] z-20">Pos</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold sticky left-8 md:left-12 bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(98,181,229)] z-20">Player</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Pts</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Perf</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Corr</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Plyd</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 text-sm">
                    No predictions made yet. Be the first to predict!
                  </td>
                </tr>
              ) : (
                leaderboard.map((player, index) => (
                  <tr 
                    key={player.username} 
                    className={`${index < 3 ? 'bg-yellow-50' : 'bg-white hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="px-2 md:px-4 py-2 md:py-3 sticky left-0 bg-inherit">
                      <div className="flex items-center justify-center w-6 md:w-auto">
                        {getPositionIcon(player.position)}
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 font-medium sticky left-8 md:left-12 bg-inherit">
                      <Link 
                        href={`/user/${player.username}`}
                        className="hover:text-[rgb(98,181,229)] transition-colors text-xs md:text-sm truncate block max-w-[100px] md:max-w-none"
                      >
                        {player.username}
                      </Link>
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-center font-bold text-sm md:text-lg text-[rgb(98,181,229)]">
                      {player.total_points}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm">
                      {player.correct_scores}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm">
                      {player.correct_results}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm">
                      {player.predictions_made}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm">
                      {player.avg_points_per_game.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Scroll indicator for mobile */}
        <div className="md:hidden px-4 py-2 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">← Swipe to see more stats →</p>
        </div>
      </div>
      
      {/* Scoring System - Mobile Responsive */}
      <div className="mt-6 bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 border border-gray-100">
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