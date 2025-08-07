'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { getTeamLogo } from '@/lib/team-logos';
import Image from 'next/image';
import { getSeasonParams } from '@/lib/season-context';

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

export function FixtureManager() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    home_team: '',
    away_team: '',
    competition: 'championship',
    kickoff_date: '',
    kickoff_time: ''
  });

  useEffect(() => {
    fetchFixtures();
  }, []);

  const fetchFixtures = async () => {
    try {
      const seasonParams = getSeasonParams();
      const response = await api.get('/fixtures', { params: seasonParams });
      setFixtures(response.data);
    } catch (error) {
      console.error('Failed to fetch fixtures:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch fixtures',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.home_team || !formData.away_team || !formData.kickoff_date || !formData.kickoff_time) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    const kickoffDateTime = new Date(`${formData.kickoff_date}T${formData.kickoff_time}`);
    
    try {
      if (editingId) {
        await api.put(`/admin/fixtures/${editingId}`, {
          home_team: formData.home_team,
          away_team: formData.away_team,
          competition: formData.competition,
          kickoff_time: kickoffDateTime.toISOString()
        });
        toast({
          title: 'Success',
          description: 'Fixture updated successfully'
        });
      } else {
        await api.post('/admin/fixtures', {
          home_team: formData.home_team,
          away_team: formData.away_team,
          competition: formData.competition,
          kickoff_time: kickoffDateTime.toISOString()
        });
        toast({
          title: 'Success',
          description: 'Fixture created successfully'
        });
      }
      
      setFormData({
        home_team: '',
        away_team: '',
        competition: 'championship',
        kickoff_date: '',
        kickoff_time: ''
      });
      setShowAddForm(false);
      setEditingId(null);
      fetchFixtures();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save fixture',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (fixture: Fixture) => {
    const date = new Date(fixture.kickoff_time);
    setFormData({
      home_team: fixture.home_team,
      away_team: fixture.away_team,
      competition: fixture.competition,
      kickoff_date: format(date, 'yyyy-MM-dd'),
      kickoff_time: format(date, 'HH:mm')
    });
    setEditingId(fixture.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fixture?')) return;
    
    try {
      await api.delete(`/admin/fixtures/${id}`);
      toast({
        title: 'Success',
        description: 'Fixture deleted successfully'
      });
      fetchFixtures();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete fixture',
        variant: 'destructive'
      });
    }
  };

  const handlePostpone = async (id: number) => {
    try {
      await api.put(`/admin/fixtures/${id}`, {
        status: 'postponed'
      });
      toast({
        title: 'Success',
        description: 'Fixture postponed'
      });
      fetchFixtures();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to postpone fixture',
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
        <h2 className="text-2xl font-bold text-gray-800">Fixture Management</h2>
        <Button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setFormData({
              home_team: '',
              away_team: '',
              competition: 'championship',
              kickoff_date: '',
              kickoff_time: ''
            });
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? 'Cancel' : 'Add Fixture'}
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Home Team
              </label>
              <Input
                value={formData.home_team}
                onChange={(e) => setFormData({ ...formData, home_team: e.target.value })}
                placeholder="e.g., Coventry City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Away Team
              </label>
              <Input
                value={formData.away_team}
                onChange={(e) => setFormData({ ...formData, away_team: e.target.value })}
                placeholder="e.g., Norwich City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Competition
              </label>
              <Select
                value={formData.competition}
                onValueChange={(value) => setFormData({ ...formData, competition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="championship">Championship</SelectItem>
                  <SelectItem value="fa_cup">FA Cup</SelectItem>
                  <SelectItem value="league_cup">League Cup</SelectItem>
                  <SelectItem value="playoff">Playoff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kickoff Date
              </label>
              <Input
                type="date"
                value={formData.kickoff_date}
                onChange={(e) => setFormData({ ...formData, kickoff_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kickoff Time
              </label>
              <Input
                type="time"
                value={formData.kickoff_time}
                onChange={(e) => setFormData({ ...formData, kickoff_time: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              {editingId ? 'Update Fixture' : 'Create Fixture'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {fixtures
          .filter(f => f.status === 'scheduled')
          .map((fixture) => (
            <div key={fixture.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Image
                      src={getTeamLogo(fixture.home_team)}
                      alt={fixture.home_team}
                      width={24}
                      height={24}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="font-medium">{fixture.home_team}</span>
                  </div>
                  <span className="text-gray-400">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fixture.away_team}</span>
                    <Image
                      src={getTeamLogo(fixture.away_team)}
                      alt={fixture.away_team}
                      width={24}
                      height={24}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(fixture.kickoff_time), 'PP')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(fixture.kickoff_time), 'p')}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(fixture)}
                      disabled={fixture.predictions_count > 0}
                      title={fixture.predictions_count > 0 ? 'Cannot edit fixture with predictions' : 'Edit fixture'}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePostpone(fixture.id)}
                      title="Postpone fixture"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(fixture.id)}
                      disabled={fixture.predictions_count > 0}
                      title={fixture.predictions_count > 0 ? 'Cannot delete fixture with predictions' : 'Delete fixture'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {fixture.predictions_count > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {fixture.predictions_count} predictions made
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}