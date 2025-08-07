'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { getTeamLogo } from '@/lib/team-logos';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import { MatchResultsModal } from './match-results-modal';

export function RecentResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchRecentResults();
  }, []);

  const fetchRecentResults = async () => {
    try {
      const response = await api.get('/fixtures/recent');
      setResults(response.data);
    } catch (error) {
      console.error('Failed to fetch recent results:', error);
    } finally {
      setLoading(false);
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
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Season Starting Soon</h3>
          <p className="text-sm text-gray-500">
            Results will appear here after matches are played
          </p>
          <p className="text-xs text-gray-400 mt-2">
            First match: August 9, 2025
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="space-y-4">
        {results.map((fixture) => (
          <div key={fixture.id} className="border-b pb-3 last:border-0">
            <div className="flex justify-between items-center mb-1">
              <div className="text-sm text-gray-600">
                {format(new Date(fixture.kickoff_time), 'PP')}
              </div>
              <div className="text-xs text-gray-500">
                {fixture.competition.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 flex items-center gap-2">
                <Image 
                  src={getTeamLogo(fixture.home_team)} 
                  alt={fixture.home_team}
                  width={24}
                  height={24}
                  className="inline-block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="font-medium">{fixture.home_team}</span>
              </div>
              <div className="px-4">
                <span className="font-bold text-lg">
                  {fixture.home_score} - {fixture.away_score}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-end gap-2">
                <span className="font-medium">{fixture.away_team}</span>
                <Image 
                  src={getTeamLogo(fixture.away_team)} 
                  alt={fixture.away_team}
                  width={24}
                  height={24}
                  className="inline-block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {fixture.predictions_count} predictions
              </span>
              <button
                onClick={() => {
                  setSelectedFixture(fixture);
                  setModalOpen(true);
                }}
                className="text-xs text-[rgb(98,181,229)] hover:text-[rgb(78,145,183)] transition-colors flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                View Results
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <MatchResultsModal
        fixture={selectedFixture}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedFixture(null);
        }}
      />
    </div>
  );
}