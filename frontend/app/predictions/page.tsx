'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function PredictionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Clear any old localStorage token
    localStorage.removeItem('token');
    
    // Set the token for API calls
    if (session.accessToken) {
      console.log('Setting token from session:', session.accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
    }
    
    fetchPredictions();
  }, [session, status, router]);

  const fetchPredictions = async () => {
    try {
      const response = await api.get('/predictions/my');
      setPredictions(response.data);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPointsColor = (points: number) => {
    if (points === 3) return 'text-green-600 font-bold';
    if (points === 1) return 'text-blue-600';
    return 'text-gray-400';
  };

  if (loading) {
    return <div className="text-center py-8">Loading predictions...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">My Predictions</h1>
        <p className="text-gray-600">Track your prediction history and points earned</p>
      </div>
      
      <div className="space-y-4">
        {predictions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-xl text-gray-700 font-semibold">No predictions yet</p>
            <p className="text-gray-500 mt-2">Start predicting to climb the leaderboard!</p>
            <p className="text-sm text-gray-400 mt-4">Predictions open for the next match only</p>
          </div>
        ) : (
          predictions.map((pred) => (
            <div key={pred.id} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-gray-600">
                  {format(new Date(pred.fixture_kickoff), 'PPp')}
                </div>
                <div className={`text-lg ${getPointsColor(pred.points_earned)}`}>
                  {pred.points_earned} pts
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{pred.fixture_home_team}</p>
                  <p className="text-2xl font-bold mt-1">
                    {pred.home_prediction}
                  </p>
                  {pred.fixture_home_score !== null && (
                    <p className="text-sm text-gray-500">
                      Actual: {pred.fixture_home_score}
                    </p>
                  )}
                </div>
                
                <div className="px-6 text-center">
                  <p className="text-gray-400">VS</p>
                </div>
                
                <div className="flex-1 text-right">
                  <p className="font-medium">{pred.fixture_away_team}</p>
                  <p className="text-2xl font-bold mt-1">
                    {pred.away_prediction}
                  </p>
                  {pred.fixture_away_score !== null && (
                    <p className="text-sm text-gray-500">
                      Actual: {pred.fixture_away_score}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Predicted: {format(new Date(pred.created_at), 'PP')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}