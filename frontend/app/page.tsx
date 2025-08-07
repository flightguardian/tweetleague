'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { PredictionCard } from '@/components/prediction-card';
import { RecentResults } from '@/components/recent-results';
import { TopLeaderboard } from '@/components/top-leaderboard';
import { Trophy, Users, Target } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const [nextFixture, setNextFixture] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch fixtures regardless of auth status
    fetchNextFixture();
  }, []);
  
  useEffect(() => {
    // Set the token for authenticated API calls when session changes
    if (session?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
    }
  }, [session]);

  const fetchNextFixture = async () => {
    try {
      console.log('Fetching next fixture...');
      const response = await api.get('/fixtures/next');
      console.log('Next fixture:', response.data);
      setNextFixture(response.data);
    } catch (error: any) {
      console.error('Failed to fetch next fixture:', error);
      console.error('Error response:', error.response);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center py-12 px-8">
          <h1 className="text-5xl font-black mb-4 tracking-tight">
            COVENTRY CITY
          </h1>
          <p className="text-2xl font-light opacity-95 mb-2">
            Tweet League
          </p>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Predict match outcomes and compete with fellow Sky Blues fans!
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-10 max-w-3xl mx-auto">
            <div className="bg-white/20 backdrop-blur rounded-xl p-6 hover:bg-white/30 transition-all">
              <Trophy className="h-12 w-12 text-yellow-300 mx-auto mb-3" />
              <p className="font-bold text-lg">Win Points</p>
              <p className="text-sm opacity-90 mt-1">3 pts for perfect score</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-6 hover:bg-white/30 transition-all">
              <Target className="h-12 w-12 text-green-300 mx-auto mb-3" />
              <p className="font-bold text-lg">Predict</p>
              <p className="text-sm opacity-90 mt-1">1 pt for correct result</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-6 hover:bg-white/30 transition-all">
              <Users className="h-12 w-12 text-purple-300 mx-auto mb-3" />
              <p className="font-bold text-lg">Compete</p>
              <p className="text-sm opacity-90 mt-1">Rise up the ranks</p>
            </div>
          </div>
        </div>
      </div>

      {nextFixture && (
        <div>
          <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
            <span className="w-1 h-8 bg-[rgb(98,181,229)] rounded-full"></span>
            Next Match
          </h2>
          <PredictionCard fixture={nextFixture} onPredictionSubmit={fetchNextFixture} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-3">
            <span className="w-1 h-6 bg-[rgb(98,181,229)] rounded-full"></span>
            Recent Results
          </h2>
          <RecentResults />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-3">
            <span className="w-1 h-6 bg-[rgb(98,181,229)] rounded-full"></span>
            Hot Players 🔥
          </h2>
          <TopLeaderboard />
        </div>
      </div>
    </div>
  );
}