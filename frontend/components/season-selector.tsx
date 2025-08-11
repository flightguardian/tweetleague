'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Calendar, ChevronDown } from 'lucide-react';

interface Season {
  id: number;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  is_current: boolean;
}

export function SeasonSelector() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      const response = await api.get('/seasons/');
      const allSeasons = response.data;
      
      // Filter to only show active and archived seasons
      const visibleSeasons = allSeasons.filter((s: Season) => 
        s.status === 'ACTIVE' || s.status === 'ARCHIVED'
      );
      
      setSeasons(visibleSeasons);
      
      // Set current season as selected
      const current = visibleSeasons.find((s: Season) => s.is_current);
      if (current) {
        setSelectedSeason(current);
        // Store in localStorage for persistence
        localStorage.setItem('selectedSeasonId', current.id.toString());
      }
    } catch (error) {
      // Error fetching seasons
    } finally {
      setLoading(false);
    }
  };

  const selectSeason = (season: Season) => {
    setSelectedSeason(season);
    localStorage.setItem('selectedSeasonId', season.id.toString());
    setShowDropdown(false);
    
    // Reload the page to fetch data for the new season
    window.location.reload();
  };

  if (loading || !selectedSeason) {
    return null;
  }

  // Only show selector if there are multiple seasons
  if (seasons.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
      >
        <Calendar className="h-4 w-4 text-gray-600" />
        <span className="font-medium">{selectedSeason.name}</span>
        {selectedSeason.is_current && (
          <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded font-semibold">
            CURRENT
          </span>
        )}
        <ChevronDown className="h-4 w-4 text-gray-600" />
      </button>

      {showDropdown && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[180px]">
          <div className="py-1">
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => selectSeason(season)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  season.id === selectedSeason.id ? 'bg-gray-50' : ''
                }`}
              >
                <span className="font-medium">{season.name}</span>
                {season.is_current && (
                  <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded font-semibold">
                    CURRENT
                  </span>
                )}
                {season.status === 'ARCHIVED' && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded font-semibold">
                    ARCHIVED
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}