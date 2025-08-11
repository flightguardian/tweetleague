'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface SeasonContextType {
  seasons: Season[];
  currentSeason: Season | null;
  selectedSeasonId: number | null;
  setSelectedSeasonId: (id: number | null) => void;
  loading: boolean;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      const response = await api.get('/seasons/');
      setSeasons(response.data);
      
      // Set current season as selected by default
      const current = response.data.find((s: Season) => s.is_current);
      if (current && !selectedSeasonId) {
        setSelectedSeasonId(current.id);
      }
    } catch (error) {
      // Error fetching seasons
    } finally {
      setLoading(false);
    }
  };

  const currentSeason = seasons.find(s => s.is_current) || null;

  return (
    <SeasonContext.Provider value={{
      seasons,
      currentSeason,
      selectedSeasonId,
      setSelectedSeasonId,
      loading
    }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeasons() {
  const context = useContext(SeasonContext);
  if (context === undefined) {
    throw new Error('useSeasons must be used within a SeasonProvider');
  }
  return context;
}

// Helper functions for season params
export function getSelectedSeasonId(): number | null {
  if (typeof window === 'undefined') return null;
  
  const storedId = localStorage.getItem('selectedSeasonId');
  if (storedId) {
    return parseInt(storedId, 10);
  }
  return null;
}

export function getSeasonParams() {
  const seasonId = getSelectedSeasonId();
  if (seasonId) {
    return { season_id: seasonId };
  }
  return {};
}