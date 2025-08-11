'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Calendar, Archive, Play, Plus, Copy, Trash2, Users, Trophy, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  is_current: boolean;
  fixture_count: number;
  user_count: number;
  prediction_count: number;
  created_at: string;
  updated_at: string | null;
}

export function SeasonManager() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      const response = await api.get('/seasons/');
      setSeasons(response.data);
    } catch (error) {
      // Error fetching seasons
    } finally {
      setLoading(false);
    }
  };

  const createSeason = async () => {
    try {
      await api.post('/seasons/', {
        name: formData.name,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      });
      setShowCreateForm(false);
      setFormData({ name: '', start_date: '', end_date: '' });
      fetchSeasons();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create season');
    }
  };

  const activateSeason = async (seasonId: number) => {
    if (!confirm('This will make this season the current active season. Continue?')) return;
    
    try {
      await api.put(`/seasons/${seasonId}/activate`);
      fetchSeasons();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to activate season');
    }
  };

  const archiveSeason = async (seasonId: number) => {
    if (!confirm('This will archive the season. Continue?')) return;
    
    try {
      await api.put(`/seasons/${seasonId}/archive`);
      fetchSeasons();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to archive season');
    }
  };

  const deleteSeason = async (seasonId: number) => {
    if (!confirm('This will permanently delete the season. This cannot be undone. Continue?')) return;
    
    try {
      await api.delete(`/seasons/${seasonId}`);
      fetchSeasons();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete season');
    }
  };

  const cloneFixtures = async (targetSeasonId: number, sourceSeasonId: number) => {
    if (!confirm(`Clone all fixtures from season to this season?`)) return;
    
    try {
      const response = await api.post(`/seasons/${targetSeasonId}/clone-fixtures`, null, {
        params: { source_season_id: sourceSeasonId }
      });
      alert(response.data.message);
      fetchSeasons();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to clone fixtures');
    }
  };

  const getStatusBadge = (status: string, isCurrent: boolean) => {
    if (isCurrent) {
      return <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-800 rounded-full">CURRENT</span>;
    }
    
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">ACTIVE</span>;
      case 'DRAFT':
        return <span className="px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-800 rounded-full">DRAFT</span>;
      case 'ARCHIVED':
        return <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-800 rounded-full">ARCHIVED</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Season Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-[rgb(98,181,229)] text-white px-4 py-2 rounded-lg hover:bg-[rgb(78,145,183)] transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Season
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Create New Season</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Season Name (e.g., 2026-2027)
              </label>
              <input
                type="text"
                placeholder="2026-2027"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                pattern="\d{4}-\d{4}"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[rgb(98,181,229)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[rgb(98,181,229)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[rgb(98,181,229)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createSeason}
              disabled={!formData.name || !formData.start_date || !formData.end_date}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Create Season
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({ name: '', start_date: '', end_date: '' });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {seasons.map((season) => (
          <div key={season.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{season.name}</h3>
                  {getStatusBadge(season.status, season.is_current)}
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {format(new Date(season.start_date), 'PP')} - {format(new Date(season.end_date), 'PP')}
                </div>

                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>{season.fixture_count} fixtures</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{season.user_count} users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-gray-400" />
                    <span>{season.prediction_count} predictions</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {season.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => activateSeason(season.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Activate Season"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    {seasons.some(s => s.status === 'ARCHIVED' || s.status === 'ACTIVE') && (
                      <button
                        onClick={() => {
                          const sourceId = prompt('Enter source season ID to clone from:');
                          if (sourceId) cloneFixtures(season.id, parseInt(sourceId));
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Clone Fixtures"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                    {season.fixture_count === 0 && (
                      <button
                        onClick={() => deleteSeason(season.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Season"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
                {season.status === 'ACTIVE' && !season.is_current && (
                  <>
                    <button
                      onClick={() => activateSeason(season.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Make Current"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => archiveSeason(season.id)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      title="Archive Season"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </>
                )}
                {season.status === 'ARCHIVED' && (
                  <button
                    onClick={() => activateSeason(season.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Make Current"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {seasons.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No seasons found. Create your first season to get started.
        </div>
      )}
    </div>
  );
}