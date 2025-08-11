'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { X, Trophy, Target, Users } from 'lucide-react';
import { format } from 'date-fns';
import { getTeamLogo } from '@/lib/team-logos';
import Image from 'next/image';

interface MatchResultsModalProps {
  fixture: any;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchResultsModal({ fixture, isOpen, onClose }: MatchResultsModalProps) {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && fixture) {
      fetchPredictions();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      // Re-enable body scroll when modal closes
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, fixture]);

  const fetchPredictions = async () => {
    try {
      const response = await api.get(`/predictions/fixture/${fixture.id}`);
      setPredictions(response.data);
    } catch (error) {
      // Error fetching predictions
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const perfectPredictions = predictions.filter(p => p.points_earned === 3);
  const correctResults = predictions.filter(p => p.points_earned === 1);
  const wrongPredictions = predictions.filter(p => p.points_earned === 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[90vh]">
        <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white p-4 md:p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Match Results</h2>
              <p className="text-white/80 text-sm">
                {format(new Date(fixture.kickoff_time), 'PPP')} · {fixture.competition.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex items-center justify-center mt-6 mb-4 gap-2 md:gap-4">
            <div className="text-center flex-1 min-w-0">
              <Image 
                src={getTeamLogo(fixture.home_team)} 
                alt={fixture.home_team}
                width={60}
                height={60}
                className="mx-auto mb-2 w-10 h-10 md:w-[60px] md:h-[60px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="font-semibold text-xs md:text-base truncate px-1">{fixture.home_team}</p>
            </div>
            <div className="flex-shrink-0 px-2 md:px-8">
              <div className="text-2xl md:text-5xl font-bold whitespace-nowrap">
                {fixture.home_score} - {fixture.away_score}
              </div>
            </div>
            <div className="text-center flex-1 min-w-0">
              <Image 
                src={getTeamLogo(fixture.away_team)} 
                alt={fixture.away_team}
                width={60}
                height={60}
                className="mx-auto mb-2 w-10 h-10 md:w-[60px] md:h-[60px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <p className="font-semibold text-xs md:text-base truncate px-1">{fixture.away_team}</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
            <div className="text-center p-2 md:p-4 bg-yellow-50 rounded-lg">
              <Trophy className="h-6 md:h-8 w-6 md:w-8 text-yellow-500 mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-2xl font-bold">{perfectPredictions.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Perfect</p>
            </div>
            <div className="text-center p-2 md:p-4 bg-green-50 rounded-lg">
              <Target className="h-6 md:h-8 w-6 md:w-8 text-green-500 mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-2xl font-bold">{correctResults.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Correct</p>
            </div>
            <div className="text-center p-2 md:p-4 bg-gray-50 rounded-lg">
              <Users className="h-6 md:h-8 w-6 md:w-8 text-gray-500 mx-auto mb-1 md:mb-2" />
              <p className="text-xl md:text-2xl font-bold">{predictions.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Total</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(98,181,229)] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading predictions...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {perfectPredictions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="bg-yellow-100 w-8 h-8 rounded-full flex items-center justify-center">
                      🎯
                    </span>
                    Perfect Predictions (+3 points)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {perfectPredictions.map((pred, idx) => (
                      <div key={idx} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="font-medium text-sm">{pred.username}</p>
                        <p className="text-lg font-bold text-yellow-700">
                          {pred.home_prediction} - {pred.away_prediction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {correctResults.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center">
                      ✓
                    </span>
                    Correct Results (+1 point)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {correctResults.map((pred, idx) => (
                      <div key={idx} className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="font-medium text-sm">{pred.username}</p>
                        <p className="text-lg font-bold text-green-700">
                          {pred.home_prediction} - {pred.away_prediction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wrongPredictions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                      ✗
                    </span>
                    Wrong Predictions (0 points)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {wrongPredictions.map((pred, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="font-medium text-sm text-gray-600">{pred.username}</p>
                        <p className="text-lg font-bold text-gray-500">
                          {pred.home_prediction} - {pred.away_prediction}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {predictions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No predictions were made for this match
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}