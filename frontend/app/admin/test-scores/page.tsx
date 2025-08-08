'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Trophy, Undo2, FlaskConical } from 'lucide-react';

export default function TestScoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fixtureId, setFixtureId] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedFixtures, setSimulatedFixtures] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth');
      return;
    }
    
    // Set the token for API calls
    if (session.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
    }
    
    // Check if user is admin
    checkAdminStatus();
  }, [session, status, router]);

  const checkAdminStatus = async () => {
    try {
      const response = await api.get('/users/me');
      if (!response.data.is_admin) {
        toast({
          title: 'Access Denied',
          description: 'Admin access required',
          variant: 'destructive',
        });
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    }
  };

  const handleSimulate = async () => {
    if (!fixtureId || !homeScore || !awayScore) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/admin/test/simulate-score/${fixtureId}`, {
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore),
      });

      setResults(response.data);
      setSimulatedFixtures(prev => new Set(prev).add(parseInt(fixtureId)));
      
      toast({
        title: 'Score Simulated!',
        description: `${response.data.fixture.home_team} ${homeScore}-${awayScore} ${response.data.fixture.away_team}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to simulate score',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (undoFixtureId?: string) => {
    const idToUndo = undoFixtureId || fixtureId;
    if (!idToUndo) {
      toast({
        title: 'Error',
        description: 'Please enter a fixture ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/admin/test/undo-score/${idToUndo}`);
      
      setSimulatedFixtures(prev => {
        const newSet = new Set(prev);
        newSet.delete(parseInt(idToUndo));
        return newSet;
      });
      
      if (idToUndo === fixtureId) {
        setResults(null);
      }
      
      toast({
        title: 'Score Undone!',
        description: response.data.message,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to undo score',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(98,181,229)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-purple-600" />
          Test Score Simulator
        </h1>
        <p className="text-gray-600 mt-2">
          Simulate fixture scores for testing. All changes can be undone.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Simulate Fixture Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fixture ID
                </label>
                <Input
                  type="number"
                  value={fixtureId}
                  onChange={(e) => setFixtureId(e.target.value)}
                  placeholder="Enter fixture ID"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Home Score
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Away Score
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    placeholder="0"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSimulate}
                  disabled={loading || !fixtureId || !homeScore || !awayScore}
                  className="flex-1"
                >
                  {loading ? 'Simulating...' : 'Simulate Score'}
                </Button>
                {simulatedFixtures.has(parseInt(fixtureId)) && (
                  <Button
                    onClick={() => handleUndo()}
                    disabled={loading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Undo2 className="h-4 w-4" />
                    Undo This
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Simulation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">
                    {results.fixture.home_team} {results.fixture.simulated_score} {results.fixture.away_team}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Predictions:</span>
                      <span className="ml-2 font-semibold">{results.predictions_processed}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Exact Scores:</span>
                      <span className="ml-2 font-semibold text-green-600">{results.total_exact_scores}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Correct Results:</span>
                      <span className="ml-2 font-semibold text-blue-600">{results.total_correct_results}</span>
                    </div>
                  </div>
                </div>

                {results.results && results.results.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">User Results:</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.results.map((r: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{r.username}</span>
                            <span className="text-sm text-gray-600">
                              Predicted: {r.prediction}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {r.exact ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : r.points > 0 ? (
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={`font-semibold ${
                              r.exact ? 'text-green-600' : 
                              r.points > 0 ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {r.points} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {simulatedFixtures.size > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Currently Simulated Fixtures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from(simulatedFixtures).map(id => (
                  <div key={id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span>Fixture #{id}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUndo(id.toString())}
                      disabled={loading}
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Undo
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}