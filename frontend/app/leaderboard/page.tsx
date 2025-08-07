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
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="text-lg font-medium">{position}</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Season Leaderboard</h1>
        <p className="text-gray-600">Track the best predictors in the Sky Blues community</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(78,145,183)] text-white">
            <tr>
              <th className="px-4 py-3 text-left">Position</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-center">Points</th>
              <th className="px-4 py-3 text-center">Perfect</th>
              <th className="px-4 py-3 text-center">Correct</th>
              <th className="px-4 py-3 text-center">Played</th>
              <th className="px-4 py-3 text-center">Avg</th>
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
      
      <div className="mt-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-[rgb(98,181,229)] rounded-full"></span>
          Scoring System
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl mb-1">🎯</div>
            <div className="font-bold text-green-800">Perfect Score</div>
            <div className="text-2xl font-bold text-green-600">3 points</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl mb-1">✅</div>
            <div className="font-bold text-blue-800">Correct Result</div>
            <div className="text-2xl font-bold text-blue-600">1 point</div>
          </div>
        </div>
      </div>
    </div>
  );
}