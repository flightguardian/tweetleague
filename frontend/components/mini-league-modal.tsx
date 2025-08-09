'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { X, Users, Trophy, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MiniLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'join';
  onSuccess: () => void;
}

export function MiniLeagueModal({ isOpen, onClose, mode, onSuccess }: MiniLeagueModalProps) {
  const [leagueName, setLeagueName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [maxMembers, setMaxMembers] = useState(50);
  const [loading, setLoading] = useState(false);
  const [createdLeague, setCreatedLeague] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!leagueName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a league name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/mini-leagues/create', {
        name: leagueName,
        description: description || null,
        max_members: maxMembers,
      });
      
      setCreatedLeague(response.data);
      toast({
        title: 'League Created!',
        description: `${response.data.name} has been created successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create league',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an invite code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/mini-leagues/join/${inviteCode.toUpperCase()}`);
      
      toast({
        title: 'Joined League!',
        description: `You've joined ${response.data.name}`,
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to join league',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (createdLeague) {
      navigator.clipboard.writeText(createdLeague.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard',
      });
    }
  };

  const handleClose = () => {
    setLeagueName('');
    setDescription('');
    setInviteCode('');
    setMaxMembers(50);
    setCreatedLeague(null);
    onClose();
    if (createdLeague) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-[rgb(98,181,229)] to-[rgb(49,91,115)] text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {mode === 'create' ? 'Create Mini League' : 'Join Mini League'}
              </h2>
              <p className="text-white/80 text-sm">
                {mode === 'create' 
                  ? 'Create your own mini league and invite friends'
                  : 'Enter an invite code to join a mini league'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!createdLeague ? (
            <>
              {mode === 'create' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mini League Name *
                    </label>
                    <input
                      type="text"
                      value={leagueName}
                      onChange={(e) => setLeagueName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(98,181,229)]"
                      placeholder="e.g., Work Friends 2025"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(98,181,229)]"
                      placeholder="Describe your mini league..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Members
                    </label>
                    <select
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(98,181,229)]"
                    >
                      <option value={10}>10 members</option>
                      <option value={25}>25 members</option>
                      <option value={50}>50 members</option>
                      <option value={100}>100 members</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={loading || !leagueName.trim()}
                    className="w-full bg-[rgb(98,181,229)] text-white py-3 rounded-lg font-medium hover:bg-[rgb(78,145,183)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Mini League'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invite Code
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => {
                        // Only allow letters
                        const filtered = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                        setInviteCode(filtered);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(98,181,229)] text-center text-xl font-mono uppercase"
                      placeholder="ABCDEFGH"
                      maxLength={8}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get the invite code from your mini league creator
                    </p>
                  </div>

                  <button
                    onClick={handleJoin}
                    disabled={loading || !inviteCode.trim()}
                    className="w-full bg-[rgb(98,181,229)] text-white py-3 rounded-lg font-medium hover:bg-[rgb(78,145,183)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Joining...' : 'Join Mini League'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-lg">{createdLeague.name}</h3>
                    <p className="text-sm text-gray-600">Mini league created successfully!</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Invite Code</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border-2 border-gray-300 rounded-lg px-4 py-3 font-mono text-xl text-center">
                    {createdLeague.invite_code}
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="p-3 bg-[rgb(98,181,229)] text-white rounded-lg hover:bg-[rgb(78,145,183)] transition-colors"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this code with friends to invite them to your mini league
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}