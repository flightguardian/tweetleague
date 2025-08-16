'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Trophy, Medal, Award, Calendar } from 'lucide-react';
import Link from 'next/link';
import { UserProfileModal } from '@/components/user-profile-modal';

export function ManagerOfMonth() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    // Clear old season selection since we removed the selector
    localStorage.removeItem('selectedSeasonId');
    fetchMonthLeaders();
    // Set current month name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    setCurrentMonth(monthNames[now.getMonth()]);
  }, []);

  const fetchMonthLeaders = async () => {
    try {
      const response = await api.get('/leaderboard/month');
      setLeaders(response.data);
    } catch (error) {
      // Error fetching monthly leaderboard
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

  // Show placeholder when no games have been played this month
  if (leaders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Games This Month</h3>
          <p className="text-sm text-gray-500">
            Manager of the Month will appear after matches are played
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Based on {currentMonth} performance
          </p>
        </div>
      </div>
    );
  }

  // Get the leader for special styling
  const leader = leaders[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {currentMonth} Performance
      </h3>
      
      {/* Featured Leader Card */}
      {leader && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-600 font-semibold">MANAGER OF THE MONTH</p>
                <button
                  onClick={() => {
                    setSelectedUser(leader.username);
                    setShowUserModal(true);
                  }}
                  className="text-lg font-bold hover:text-[rgb(98,181,229)] transition-colors text-left"
                >
                  {leader.username}
                </button>
                <p className="text-xs text-gray-600">
                  {leader.predictions_made} games • {leader.avg_points_per_game.toFixed(1)} pts/game
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-600">{leader.total_points}</p>
              <p className="text-xs text-gray-600">points</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Rest of the top performers */}
      <div className="space-y-3">
        {leaders.slice(1, 5).map((player) => (
          <div key={player.username} className="flex items-center justify-between border-b pb-3 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 text-center">
                {getPositionIcon(player.position)}
              </div>
              <div>
                <button
                  onClick={() => {
                    setSelectedUser(player.username);
                    setShowUserModal(true);
                  }}
                  className="font-medium hover:text-[rgb(98,181,229)] transition-colors text-left"
                >
                  {player.username}
                </button>
                <p className="text-xs text-gray-600">
                  {player.predictions_made} games
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
      
      {leaders.length > 5 && (
        <Link 
          href="/leaderboard"
          className="block text-center text-sm text-[rgb(98,181,229)] hover:underline mt-4"
        >
          View full leaderboard →
        </Link>
      )}
      
      {/* User Profile Modal */}
      <UserProfileModal
        username={selectedUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}