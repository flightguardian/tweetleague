'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Trophy, Medal, Award } from 'lucide-react';
import Link from 'next/link';

export function TopLeaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear old season selection since we removed the selector
    localStorage.removeItem('selectedSeasonId');
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/leaderboard/top');
      setLeaders(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-gray-600 font-medium">{position}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Show placeholder when no games have been played yet
  if (leaders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Rankings Yet</h3>
          <p className="text-sm text-gray-500">
            Form rankings will appear after matches are played
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Based on last 5 games performance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Form Table (Last 5 Games)
      </h3>
      <div className="space-y-3">
        {leaders.slice(0, 10).map((player) => (
          <div key={player.username} className="flex items-center justify-between border-b pb-3 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 text-center">
                {getPositionIcon(player.position)}
              </div>
              <div>
                <Link 
                  href={`/user/${player.username}`}
                  className="font-medium hover:text-[rgb(98,181,229)] transition-colors"
                >
                  {player.username}
                </Link>
                <p className="text-xs text-gray-600">
                  {player.predictions_made}/5 games
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{player.total_points}</p>
              <p className="text-xs text-gray-600">
                {player.avg_points_per_game.toFixed(1)} pts/game
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}