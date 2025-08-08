'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { PredictionCard } from '@/components/prediction-card';
import { RecentResults } from '@/components/recent-results';
import { ManagerOfMonth } from '@/components/manager-of-month';
import { EmailVerificationModal } from '@/components/email-verification-modal';
import { Trophy, Users, Target, HelpCircle, ArrowRight } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
      {/* Email Verification Modal */}
      {session && <EmailVerificationModal />}
      
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl bg-gradient-to-br from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center py-6 md:py-12 px-4 md:px-8">
          <h1 className="text-2xl md:text-5xl font-black mb-2 md:mb-4 tracking-tight">
            COVENTRY CITY
          </h1>
          <p className="text-lg md:text-2xl font-light opacity-95 mb-1 md:mb-2">
            Tweet League
          </p>
          <p className="text-sm md:text-lg opacity-90 max-w-2xl mx-auto">
            Predict match outcomes and compete with fellow Sky Blues fans!
          </p>
          
          <div className="grid grid-cols-3 gap-2 md:gap-6 mt-6 md:mt-10 max-w-3xl mx-auto">
            <div className="bg-white/20 backdrop-blur rounded-lg md:rounded-xl p-3 md:p-6 hover:bg-white/30 transition-all">
              <Trophy className="h-8 w-8 md:h-12 md:w-12 text-yellow-300 mx-auto mb-2 md:mb-3" />
              <p className="font-bold text-sm md:text-lg">Win Points</p>
              <p className="text-xs md:text-sm opacity-90 mt-1 hidden md:block">3 pts for perfect score</p>
              <p className="text-xs opacity-90 mt-1 md:hidden">3 pts perfect</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg md:rounded-xl p-3 md:p-6 hover:bg-white/30 transition-all">
              <Target className="h-8 w-8 md:h-12 md:w-12 text-green-300 mx-auto mb-2 md:mb-3" />
              <p className="font-bold text-sm md:text-lg">Predict</p>
              <p className="text-xs md:text-sm opacity-90 mt-1 hidden md:block">1 pt for correct result</p>
              <p className="text-xs opacity-90 mt-1 md:hidden">1 pt correct</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg md:rounded-xl p-3 md:p-6 hover:bg-white/30 transition-all">
              <Users className="h-8 w-8 md:h-12 md:w-12 text-purple-300 mx-auto mb-2 md:mb-3" />
              <p className="font-bold text-sm md:text-lg">Compete</p>
              <p className="text-xs md:text-sm opacity-90 mt-1 hidden md:block">Rise up the ranks</p>
              <p className="text-xs opacity-90 mt-1 md:hidden">Climb ranks</p>
            </div>
          </div>
          
          <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-4">
            {!session && (
              <Link href="/register">
                <Button size="lg" variant="secondary" className="bg-white text-[rgb(98,181,229)] hover:bg-gray-100 font-semibold">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link href="/how-it-works">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white bg-white/10 backdrop-blur text-white hover:bg-white hover:text-[rgb(98,181,229)] transition-all"
              >
                <HelpCircle className="mr-2 h-5 w-5" />
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
          <span className="w-1 h-8 bg-[rgb(98,181,229)] rounded-full"></span>
          Next Match
        </h2>
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
            <div className="animate-pulse">
              <div className="flex justify-between items-center mb-6">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex justify-around items-center mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <div className="h-12 bg-gray-200 rounded w-20"></div>
                <div className="h-12 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="mt-6">
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        ) : nextFixture ? (
          <PredictionCard fixture={nextFixture} onPredictionSubmit={fetchNextFixture} />
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 text-center">
            <p className="text-gray-500">No upcoming fixtures available</p>
          </div>
        )}
      </div>

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
            Manager of the Month 🏆
          </h2>
          <ManagerOfMonth />
        </div>
      </div>
    </div>
  );
}