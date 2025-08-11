'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Trophy, Users, Target, CheckCircle } from 'lucide-react';
import { getTeamLogo } from '@/lib/team-logos';
import Image from 'next/image';

interface Fixture {
  id: number;
  home_team: string;
  away_team: string;
  competition: string;
  kickoff_time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  predictions_count: number;
}

export function ScoreUpdater() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<{ [key: number]: { home: string; away: string } }>({});
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchFixtures();
  }, []);

  const fetchFixtures = async () => {
    try {
      const response = await api.get('/fixtures');
      const pastFixtures = response.data.filter((f: Fixture) => {
        const kickoff = new Date(f.kickoff_time);
        return kickoff < new Date() && f.status !== 'finished';
      });
      setFixtures(pastFixtures);
      
      // Initialize scores state
      const initialScores: { [key: number]: { home: string; away: string } } = {};
      pastFixtures.forEach((f: Fixture) => {
        initialScores[f.id] = {
          home: f.home_score?.toString() || '',
          away: f.away_score?.toString() || ''
        };
      });
      setScores(initialScores);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch fixtures',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreUpdate = async (fixtureId: number) => {
    const score = scores[fixtureId];
    
    if (!score || score.home === '' || score.away === '') {
      toast({
        title: 'Error',
        description: 'Please enter both scores',
        variant: 'destructive'
      });
      return;
    }
    
    const homeScore = parseInt(score.home);
    const awayScore = parseInt(score.away);
    
    if (isNaN(homeScore) || isNaN(awayScore)) {
      toast({
        title: 'Error',
        description: 'Please enter valid numbers',
        variant: 'destructive'
      });
      return;
    }
    
    if (homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20) {
      toast({
        title: 'Error',
        description: 'Scores must be between 0 and 20',
        variant: 'destructive'
      });
      return;
    }
    
    setUpdating(fixtureId);
    
    try {
      const response = await api.put(`/admin/fixtures/${fixtureId}/score`, {
        home_score: homeScore,
        away_score: awayScore
      });
      
      toast({
        title: 'Success',
        description: `Score updated! ${response.data.predictions_processed} predictions processed.`
      });
      
      // Refresh fixtures
      fetchFixtures();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update score',
        variant: 'destructive'
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleViewPredictions = async (fixtureId: number) => {
    try {
      const response = await api.get(`/admin/fixtures/${fixtureId}/predictions`);
      const { fixture, predictions } = response.data;
      
      // Show predictions in a dialog or toast (simplified for now)
      const predictionsList = predictions
        .map((p: any) => `${p.user}: ${p.home_prediction}-${p.away_prediction} (${p.points_earned} pts)`)
        .join('\n');
      
      alert(`Predictions for ${fixture.home_team} vs ${fixture.away_team}:\n\n${predictionsList}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch predictions',
        variant: 'destructive'
      });
    }
  };

  const handleRecalculateAll = async () => {
    if (!confirm('This will recalculate all points for all users. Are you sure?')) return;
    
    try {
      const response = await api.post('/admin/recalculate-all-points');
      toast({
        title: 'Success',
        description: `Points recalculated! ${response.data.predictions_recalculated} predictions processed.`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to recalculate points',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading fixtures...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Update Match Scores</h2>
        <Button
          onClick={handleRecalculateAll}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Trophy className="h-4 w-4" />
          Recalculate All Points
        </Button>
      </div>

      {fixtures.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No fixtures awaiting score updates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fixtures.map((fixture) => (
            <div key={fixture.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Image
                      src={getTeamLogo(fixture.home_team)}
                      alt={fixture.home_team}
                      width={32}
                      height={32}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="font-bold text-lg">{fixture.home_team}</span>
                  </div>
                  <span className="text-gray-400 text-xl">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{fixture.away_team}</span>
                    <Image
                      src={getTeamLogo(fixture.away_team)}
                      alt={fixture.away_team}
                      width={32}
                      height={32}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{format(new Date(fixture.kickoff_time), 'PPp')}</p>
                  <p className="flex items-center gap-1 mt-1">
                    <Users className="h-3 w-3" />
                    {fixture.predictions_count} predictions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Home:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={scores[fixture.id]?.home || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!/^\d*$/.test(val)) return;
                        
                        setScores({
                          ...scores,
                          [fixture.id]: {
                            ...scores[fixture.id],
                            home: val
                          }
                        });
                      }}
                      className="w-16 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-[rgb(98,181,229)] focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-xl font-bold text-gray-400">-</span>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Away:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={scores[fixture.id]?.away || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!/^\d*$/.test(val)) return;
                        
                        setScores({
                          ...scores,
                          [fixture.id]: {
                            ...scores[fixture.id],
                            away: val
                          }
                        });
                      }}
                      className="w-16 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-[rgb(98,181,229)] focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleScoreUpdate(fixture.id)}
                    disabled={updating === fixture.id}
                    className="flex items-center gap-2"
                  >
                    {updating === fixture.id ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Update Score
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewPredictions(fixture.id)}
                    className="flex items-center gap-2"
                  >
                    <Target className="h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
              
              {fixture.status === 'finished' && fixture.home_score !== null && (
                <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                  Score already updated: {fixture.home_score} - {fixture.away_score}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}