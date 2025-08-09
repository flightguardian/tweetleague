'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { getTeamLogo } from '@/lib/team-logos';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Target, TrendingUp, TrendingDown, Minus, Award, Users, ArrowLeft, Zap, Medal, ChevronDown } from 'lucide-react';

interface Prediction {
  id: number;
  username: string;
  home_prediction: number;
  away_prediction: number;
  points_earned: number;
  created_at: string;
  updated_at?: string;
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

interface MiniLeague {
  id: number;
  name: string;
  member_count: number;
}

export default function FixturePredictionsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const fixtureId = params.id;
  const [fixture, setFixture] = useState<Fixture | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingLeague, setSwitchingLeague] = useState(false);
  const [miniLeagues, setMiniLeagues] = useState<MiniLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);
  // Removed sorting - showing latest predictions first

  useEffect(() => {
    if (session?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
      fetchMiniLeagues();
    }
  }, [session]);

  useEffect(() => {
    if (fixtureId) {
      fetchData();
    }
  }, [fixtureId, selectedLeague]);

  const fetchData = async () => {
    // Don't set loading on league switch, use switchingLeague instead
    if (!loading) {
      setSwitchingLeague(true);
    }
    
    try {
      // Fetch fixture details (only on first load)
      if (!fixture) {
        const fixtureResponse = await api.get(`/fixtures/${fixtureId}`);
        setFixture(fixtureResponse.data);
      }

      // Fetch predictions with user stats, optionally filtered by mini league, with pagination
      const offset = (currentPage - 1) * predictionsPerPage;
      const params: any = { 
        limit: predictionsPerPage,
        offset: offset
      };
      if (selectedLeague) {
        params.mini_league_id = selectedLeague;
      }
      
      const predictionsResponse = await api.get(`/predictions/fixture/${fixtureId}/detailed`, { params });
      setPredictions(predictionsResponse.data.predictions || []);
      setTotalPredictions(predictionsResponse.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  // Show latest predictions first (using updated_at if available, otherwise created_at)
  const sortPredictions = (preds: Prediction[]) => {
    return [...preds].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA; // Most recent first
    });
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

      {/* Mini League Selector - Dropdown on Mobile, Buttons on Desktop */}
      {session && miniLeagues.length > 0 && (
        <>
          {/* Mobile Dropdown */}
          <div className="md:hidden bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
            <div className="mb-2">
              <p className="text-xs text-gray-500 font-medium">FILTER PREDICTIONS BY:</p>
            </div>
            <button
              onClick={() => setShowLeagueSelector(!showLeagueSelector)}
              className="w-full bg-white rounded-lg border-2 border-[rgb(98,181,229)]/30 p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[rgb(98,181,229)]" />
                  <div className="text-left">
                    <span className="font-semibold text-gray-800 text-sm">
                      {selectedLeague ? miniLeagues.find(l => l.id === selectedLeague)?.name : 'Everyone'}
                    </span>
                    {selectedLeague ? (
                      <span className="text-xs text-gray-500 ml-1">
                        ({miniLeagues.find(l => l.id === selectedLeague)?.member_count} members)
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 ml-1">
                        (All {totalPredictions} predictions)
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
                <p className="text-xs text-gray-500 mb-2">Select who to view:</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectedLeague(null);
                      setShowLeagueSelector(false);
                    }}
                    className={`w-full text-left px-3 py-2 transition-all text-sm ${
                      selectedLeague === null
                        ? 'bg-[rgb(98,181,229)]/10 text-[rgb(98,181,229)] font-semibold'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>🌍 Everyone</span>
                      <span className="text-xs text-gray-500">All predictions</span>
                    </div>
                  </button>
                </div>
                
                {/* Admin Leagues */}
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
                      className={`w-full text-left px-3 py-2 transition-all text-sm ${
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
                
                {/* Member Leagues */}
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
                          className={`w-full text-left px-3 py-2 transition-all text-sm ${
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

          {/* Desktop Buttons */}
          <div className="hidden md:block bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
            <div className="mb-3">
              <p className="text-sm text-gray-600 font-medium">Filter predictions by group:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLeague(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                  selectedLeague === null
                    ? 'bg-[rgb(98,181,229)] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🌍 Everyone
                <span className="ml-2 text-xs opacity-75">({totalPredictions})</span>
              </button>
            </div>
            
            {/* Admin Leagues */}
            {miniLeagues.filter(l => l.is_admin).length > 0 && (
              <>
                <div className="text-sm text-gray-600 font-medium mb-2 mt-3">Mini leagues you admin:</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {miniLeagues.filter(l => l.is_admin).map((league) => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                    selectedLeague === league.id
                      ? 'bg-[rgb(98,181,229)] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  👥 {league.name}
                  <span className="ml-2 text-xs opacity-75">({league.member_count})</span>
                </button>
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
                      onClick={() => setSelectedLeague(league.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                        selectedLeague === league.id
                          ? 'bg-[rgb(98,181,229)] text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        </>
      )}

      {/* Info box for non-logged in users */}
      {!session && predictions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Viewing all predictions</span> - Sign in to filter by your mini leagues
          </p>
        </div>
      )}

      {/* Stats Summary - Mobile First */}
      <div className="mb-6">
        {/* Total Predictions - Full Width on Mobile */}
        <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100 mb-4">
          <Users className="h-8 w-8 text-[rgb(98,181,229)] mx-auto mb-2" />
          <p className="text-2xl font-bold">{totalPredictions}</p>
          <p className="text-xs text-gray-600">Total Predictions</p>
        </div>
        
        {/* Average Scores - Side by Side with Team Info */}
        {fixture && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
              <Image 
                src={getTeamLogo(fixture.home_team)} 
                alt={fixture.home_team}
                width={40}
                height={40}
                className="mx-auto mb-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="text-xl font-bold">{averageHomeScore}</p>
              <p className="text-xs text-gray-600 font-medium">{fixture.home_team}</p>
              <p className="text-xs text-gray-500">Avg Prediction</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-gray-100">
              <Image 
                src={getTeamLogo(fixture.away_team)} 
                alt={fixture.away_team}
                width={40}
                height={40}
                className="mx-auto mb-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="text-xl font-bold">{averageAwayScore}</p>
              <p className="text-xs text-gray-600 font-medium">{fixture.away_team}</p>
              <p className="text-xs text-gray-500">Avg Prediction</p>
            </div>
          </div>
        )}
      </div>


      {/* Predictions List - Table Style like League Table */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl border border-gray-100 overflow-hidden relative">
        {/* Loading Overlay for League Switching */}
        {switchingLeague && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[rgb(98,181,229)]"></div>
              <p className="text-sm text-gray-600 font-medium">Loading predictions...</p>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <h2 className="font-bold text-lg">
            {selectedLeague 
              ? `${miniLeagues.find(l => l.id === selectedLeague)?.name || 'League'} Predictions`
              : 'All Predictions'
            }
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            {totalPredictions} {totalPredictions === 1 ? 'prediction' : 'predictions'} submitted
          </p>
        </div>
        
        {/* Table - Responsive without horizontal scroll */}
        <div>
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(78,145,183)] text-white">
              <tr>
                <th className="px-1 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-semibold w-10">Pos</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-semibold">Player</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Prediction</th>
                <th className="px-1 md:px-3 py-2 md:py-3 text-center text-xs md:text-sm font-semibold">Pts</th>
                <th className="hidden md:table-cell px-3 py-3 text-center text-sm font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPredictions.map((prediction, index) => (
                <tr 
                  key={prediction.id} 
                  className="bg-white hover:bg-gray-50 transition-colors"
                >
                  <td className="px-1 md:px-3 py-2 md:py-3">
                    <div className="flex items-center justify-center">
                      {prediction.user_position && prediction.user_position <= 3 ? (
                        getPositionBadge(prediction.user_position)
                      ) : (
                        <span className="text-xs md:text-sm font-bold text-gray-600">
                          {prediction.user_position || '-'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3">
                    <Link 
                      href={`/user/${prediction.username}`}
                      className="hover:text-[rgb(98,181,229)] transition-colors block"
                    >
                      <div className="font-medium text-xs md:text-sm truncate">
                        {prediction.username}
                      </div>
                      <div className="text-xs text-gray-500 md:hidden">
                        {format(new Date(prediction.updated_at || prediction.created_at), 'MMM d, h:mm a')}
                        {prediction.updated_at && <span className="italic"> (edited)</span>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                    <span className="inline-flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg px-2 md:px-3 py-1 font-bold text-sm md:text-base">
                      {prediction.home_prediction} - {prediction.away_prediction}
                    </span>
                  </td>
                  <td className="px-1 md:px-3 py-2 md:py-3 text-center font-bold text-sm md:text-base text-[rgb(98,181,229)]">
                    {prediction.user_total_points || 0}
                  </td>
                  <td className="hidden md:table-cell px-3 py-3 text-center text-xs md:text-sm text-gray-500">
                    <div>{format(new Date(prediction.updated_at || prediction.created_at), 'MMM d')}</div>
                    <div>{format(new Date(prediction.updated_at || prediction.created_at), 'h:mm a')}</div>
                    {prediction.updated_at && <div className="text-xs italic">(edited)</div>}
                  </td>
                </tr>
              ))}
              {predictions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                    No predictions yet for this fixture
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      {(() => {
        const totalPages = Math.ceil(totalPredictions / predictionsPerPage);
        
        if (totalPages <= 1) return null;
        
        const handlePageChange = (page: number) => {
          if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        };
        
        return (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * predictionsPerPage) + 1}-{Math.min(currentPage * predictionsPerPage, totalPredictions)} of {totalPredictions} predictions
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
          </div>
        );
      })()}
    </div>
  );
}