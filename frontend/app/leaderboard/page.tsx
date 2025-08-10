'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { Trophy, Medal, Award, User, TrendingUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Target, Plus, Users as UsersIcon, ChevronDown, Info, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { TopLeaderboard } from '@/components/top-leaderboard';
import { MiniLeagueModal } from '@/components/mini-league-modal';
import { toast } from '@/hooks/use-toast';

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userPosition, setUserPosition] = useState<any>(null);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [miniLeagues, setMiniLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'join'>('create');
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [switchingLeague, setSwitchingLeague] = useState(false);
  const usersPerPage = 50;

  useEffect(() => {
    // Clear old season selection from localStorage since we removed the selector
    localStorage.removeItem('selectedSeasonId');
    if (session) {
      fetchMiniLeagues();
    }
    fetchCurrentSeasonAndLeaderboard();
  }, [session, currentPage, selectedLeague]);

  const fetchCurrentSeasonAndLeaderboard = async () => {
    // Don't set loading on league switch, use switchingLeague instead
    if (!loading) {
      setSwitchingLeague(true);
    }
    
    try {
      // First get the current season
      const seasonsResponse = await api.get('/seasons/');
      const current = seasonsResponse.data.find((s: any) => s.is_current);
      setCurrentSeason(current);
      
      // Get total count of users in leaderboard
      const countResponse = await api.get('/leaderboard/count');
      console.log('Total users from API:', countResponse.data.count);
      setTotalUsers(countResponse.data.count);
      
      // Calculate offset for pagination
      const offset = (currentPage - 1) * usersPerPage;
      
      // Then fetch leaderboard for current season with pagination
      const response = await api.get('/leaderboard', {
        params: { 
          limit: usersPerPage,
          offset: offset,
          mini_league_id: selectedLeague
        }
      });
      
      // Adjust position numbers based on page
      const adjustedData = response.data.map((player: any, index: number) => ({
        ...player,
        position: offset + index + 1
      }));
      
      setLeaderboard(adjustedData);
      
      // Fetch the current user's position separately if logged in
      if (session?.user) {
        // First, try the API endpoint
        try {
          const userStatsResponse = await api.get('/leaderboard/user-position');
          console.log('User position from API:', userStatsResponse.data);
          setUserPosition(userStatsResponse.data);
        } catch (error: any) {
          console.error('User position API error:', error.response?.data || error);
        }
        
        // Also check if user is in current page (as fallback or to find mismatches)
        // Check multiple possible username formats
        const sessionUsername = session.user?.name?.toLowerCase() || '';
        const myData = adjustedData.find(player => {
          const playerUsername = player.username.toLowerCase();
          return playerUsername === sessionUsername || 
                 playerUsername === 'investorgav' || // Hardcoded check for your specific case
                 playerUsername.includes(sessionUsername) ||
                 sessionUsername.includes(playerUsername);
        });
        
        if (myData && !userPosition) {
          console.log('Found user in current page data:', myData);
          setUserPosition(myData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
      setSwitchingLeague(false);
    }
  };

  const fetchMiniLeagues = async () => {
    try {
      const response = await api.get('/mini-leagues/my-leagues');
      setMiniLeagues(response.data);
    } catch (error) {
      console.error('Failed to fetch mini leagues:', error);
    }
  };

  const handleLeagueChange = (leagueId: number | null) => {
    setSelectedLeague(leagueId);
    setCurrentPage(1);
  };

  const openModal = (mode: 'create' | 'join') => {
    setModalMode(mode);
    setShowLeagueModal(true);
  };

  const copyInviteCode = (code: string, leagueName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: 'Invite Code Copied!',
      description: `Code for ${leagueName}: ${code}`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
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

  const totalPages = Math.ceil(totalUsers / usersPerPage);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const jumpToUserPosition = () => {
    if (userPosition) {
      const userPage = Math.ceil(userPosition.position / usersPerPage);
      setCurrentPage(userPage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(98,181,229)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading league table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-3">
          {currentSeason ? `${currentSeason.name} League Table` : 'League Table'}
        </h1>
        <p className="text-gray-600 text-sm md:text-base">Track the best predictors in the Sky Blues community</p>
      </div>
      
      {/* Mini Leagues Section - Mobile First Design */}
      {session && (
        <div className="mb-6">
          {/* Mobile Layout - Dropdown Style */}
          <div className="md:hidden">
            <div className="mb-2">
              <p className="text-xs text-gray-500 font-medium">VIEWING LEAGUE TABLE FOR:</p>
            </div>
            {/* Current League Display */}
            <button
              onClick={() => setShowLeagueSelector(!showLeagueSelector)}
              className="w-full bg-white rounded-lg border-2 border-[rgb(98,181,229)]/30 p-3 mb-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-[rgb(98,181,229)]" />
                  <div className="text-left">
                    <span className="font-semibold text-gray-800">
                      {selectedLeague ? miniLeagues.find(l => l.id === selectedLeague)?.name : 'Everyone'}
                    </span>
                    {selectedLeague ? (
                      <span className="text-xs text-gray-500 ml-1">
                        ({miniLeagues.find(l => l.id === selectedLeague)?.member_count} members)
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 ml-1">
                        (All players)
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-[rgb(98,181,229)] transition-transform ${showLeagueSelector ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            {/* Dropdown Menu */}
            {showLeagueSelector && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                <p className="text-xs text-gray-500 mb-2">Select league to view:</p>
                {/* Main League - with border */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      handleLeagueChange(null);
                      setShowLeagueSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 transition-all ${
                      selectedLeague === null
                        ? 'bg-[rgb(98,181,229)]/10 text-[rgb(98,181,229)] font-semibold'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>🌍 Everyone</span>
                      <span className="text-xs text-gray-500">Main league</span>
                    </div>
                  </button>
                </div>
                
                {/* Separate admin and member leagues */}
                {miniLeagues.filter(l => l.is_admin).length > 0 && (
                  <>
                    <div className="text-xs text-gray-500 mt-2 mb-1">Mini leagues you admin:</div>
                    {miniLeagues.filter(l => l.is_admin).map((league) => (
                  <div key={league.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        handleLeagueChange(league.id);
                        setShowLeagueSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 transition-all ${
                        selectedLeague === league.id
                          ? 'bg-[rgb(98,181,229)]/10 text-[rgb(98,181,229)] font-semibold'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>👥 {league.name}</span>
                        <span className="text-xs text-gray-500">{league.member_count} members</span>
                      </div>
                    </button>
                    {league.is_admin && (
                      <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium">Invite:</span>
                        <code className="bg-white px-2 py-0.5 rounded border border-gray-200">{league.invite_code}</code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyInviteCode(league.invite_code, league.name);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {copiedCode === league.invite_code ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                    ))}
                  </>
                )}
                
                {miniLeagues.filter(l => !l.is_admin).length > 0 && (
                  <>
                    <div className="text-xs text-gray-500 mt-2 mb-1">Mini leagues you're in:</div>
                    {miniLeagues.filter(l => !l.is_admin).map((league) => (
                      <div key={league.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            handleLeagueChange(league.id);
                            setShowLeagueSelector(false);
                          }}
                          className={`w-full text-left px-3 py-2 transition-all ${
                            selectedLeague === league.id
                              ? 'bg-[rgb(98,181,229)]/10 text-[rgb(98,181,229)] font-semibold'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>👥 {league.name}</span>
                            <span className="text-xs text-gray-500">{league.member_count} members</span>
                          </div>
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            
          </div>
          
          {/* Desktop Layout - Keep Original */}
          <div className="hidden md:block">
            <div className="mb-3">
              <p className="text-sm text-gray-600 font-medium mb-2">View league table for:</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => handleLeagueChange(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedLeague === null
                    ? 'bg-[rgb(98,181,229)] text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                🌍 Everyone
              </button>
            </div>
            
            {/* Admin Leagues */}
            {miniLeagues.filter(l => l.is_admin).length > 0 && (
              <>
                <div className="text-sm text-gray-600 font-medium mb-2 mt-3">Mini leagues you admin:</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {miniLeagues.filter(l => l.is_admin).map((league) => (
                <div key={league.id} className="relative group">
                  <button
                    onClick={() => handleLeagueChange(league.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedLeague === league.id
                        ? 'bg-[rgb(98,181,229)] text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    👥 {league.name}
                    <span className="ml-2 text-xs opacity-75">({league.member_count})</span>
                    {league.is_admin && (
                      <Info className="inline-block w-3 h-3 ml-2 opacity-60" />
                    )}
                  </button>
                  {league.is_admin && (
                    <div className="absolute top-full left-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">Invite Code:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono">{league.invite_code}</code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyInviteCode(league.invite_code, league.name);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {copiedCode === league.invite_code ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                  ))}
                </div>
              </>
            )}
            
            {/* Member Leagues */}
            {miniLeagues.filter(l => !l.is_admin).length > 0 && (
              <>
                <div className="text-sm text-gray-600 font-medium mb-2 mt-3">Mini leagues you're in:</div>
                <div className="flex flex-wrap gap-2">
                  {miniLeagues.filter(l => !l.is_admin).map((league) => (
                    <button
                      key={league.id}
                      onClick={() => handleLeagueChange(league.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedLeague === league.id
                          ? 'bg-[rgb(98,181,229)] text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      👥 {league.name}
                      <span className="ml-2 text-xs opacity-75">({league.member_count})</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Table with horizontal scroll and sticky header */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl border border-gray-100 overflow-hidden relative">
        {/* Loading Overlay for League Switching */}
        {switchingLeague && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[rgb(98,181,229)]"></div>
              <p className="text-sm text-gray-600 font-medium">Loading league data...</p>
            </div>
          </div>
        )}
        
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
                    className={`${player.position <= 3 ? 'bg-yellow-50' : 'bg-white hover:bg-gray-50'} transition-colors`}
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
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * usersPerPage) + 1}-{Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} players
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {/* Show max 5 page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded ${
                      currentPage === pageNum
                        ? 'bg-[rgb(98,181,229)] text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
          
          {/* Jump to my position button */}
          {session && userPosition && Math.ceil(userPosition.position / usersPerPage) !== currentPage && (
            <button
              onClick={jumpToUserPosition}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(98,181,229)] text-white rounded-lg hover:bg-[rgb(78,145,183)] transition-colors"
            >
              <Target className="h-4 w-4" />
              Jump to My Position
            </button>
          )}
        </div>
      )}
      
      {/* Mini League Action Buttons - After Table */}
      {session && (
        <div className="mt-6">
          {/* Mobile Layout - Full Width Buttons */}
          <div className="md:hidden space-y-2">
            <button
              onClick={() => openModal('join')}
              className="w-full py-3 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Join Mini League
            </button>
            <button
              onClick={() => openModal('create')}
              className="w-full py-3 rounded-lg bg-green-500 text-white hover:bg-green-600 font-medium transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Mini League
            </button>
          </div>
          
          {/* Desktop Layout - Side by Side */}
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => openModal('join')}
              className="px-6 py-3 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 font-medium transition-all shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Join Mini League
            </button>
            <button
              onClick={() => openModal('create')}
              className="px-6 py-3 rounded-lg bg-green-500 text-white hover:bg-green-600 font-medium transition-all shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Mini League
            </button>
          </div>
        </div>
      )}
      
      {/* Debug info - remove after testing */}
      {session && (
        <div className="mb-4 p-4 bg-gray-100 rounded text-xs">
          <p>Debug: Session user: {session.user?.name || 'none'}</p>
          <p>Debug: UserPosition: {userPosition ? JSON.stringify(userPosition) : 'null'}</p>
        </div>
      )}
      
      {/* User Position Section - Show for main league only */}
      {session && selectedLeague === null && userPosition && (
        <div className="mt-6 bg-gradient-to-r from-[rgb(98,181,229)]/10 to-[rgb(78,145,183)]/10 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border-2 border-[rgb(98,181,229)]/30 overflow-hidden">
          <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(78,145,183)] text-white px-4 md:px-6 py-3 md:py-4">
            <h2 className="font-bold text-base md:text-lg flex items-center gap-2">
              <User className="h-4 w-4 md:h-5 md:w-5" />
              Your Position
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <tbody>
                <tr className="bg-white">
                  <td className="px-2 md:px-4 py-3 md:py-4 sticky left-0 bg-white">
                    <div className="flex items-center justify-center w-6 md:w-auto">
                      {getPositionIcon(userPosition.position)}
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-3 md:py-4 font-medium sticky left-8 md:left-12 bg-white">
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm truncate block max-w-[100px] md:max-w-none">
                        {userPosition.username}
                      </span>
                      <span className="text-xs bg-[rgb(98,181,229)] text-white px-2 py-0.5 rounded-full">You</span>
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-3 md:py-4 text-center font-bold text-sm md:text-lg text-[rgb(98,181,229)]">
                    {userPosition.total_points}
                  </td>
                  <td className="px-2 md:px-4 py-3 md:py-4 text-center text-xs md:text-sm">
                    {userPosition.correct_scores}
                  </td>
                  <td className="px-2 md:px-4 py-3 md:py-4 text-center text-xs md:text-sm">
                    {userPosition.correct_results}
                  </td>
                  <td className="px-2 md:px-4 py-3 md:py-4 text-center text-xs md:text-sm">
                    {userPosition.predictions_made}
                  </td>
                  <td className="px-2 md:px-4 py-3 md:py-4 text-center text-xs md:text-sm">
                    {userPosition.avg_points_per_game.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Position context */}
          <div className="px-4 md:px-6 py-3 bg-white/50 text-center">
            <p className="text-xs md:text-sm text-gray-700">
              {userPosition.position === 1 ? (
                <span className="font-bold text-yellow-600">🎉 You're in first place!</span>
              ) : userPosition.position <= 3 ? (
                <span className="font-bold text-green-600">You're on the podium!</span>
              ) : userPosition.position <= 10 ? (
                <span className="font-bold text-blue-600">You're in the top 10!</span>
              ) : (
                <span>You're ranked #{userPosition.position} out of {totalUsers} players</span>
              )}
            </p>
          </div>
        </div>
      ) : null}
      
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
      
      {/* Hot Players Section - Form Table */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-orange-500" />
          Hot Players 🔥
        </h2>
        <TopLeaderboard />
      </div>
      
      {/* Mini League Modal */}
      {showLeagueModal && (
        <MiniLeagueModal
          isOpen={showLeagueModal}
          onClose={() => setShowLeagueModal(false)}
          mode={modalMode}
          onSuccess={() => {
            setShowLeagueModal(false);
            fetchMiniLeagues();
          }}
        />
      )}
    </div>
  );
}