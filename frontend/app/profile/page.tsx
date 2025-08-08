'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Mail, Trophy, Target, Calendar, Shield, 
  Edit2, Save, X, Lock, Bell, BellOff, CheckCircle,
  TrendingUp, Award, Star, Twitter
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    email_notifications: true,
    twitter_handle: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Set the token for API calls
    if (session.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.accessToken}`;
    }
    
    fetchUserStats();
  }, [session, status, router]);

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/users/me');
      setUserStats(response.data);
      setFormData({
        username: response.data.username,
        email: response.data.email,
        email_notifications: response.data.email_notifications,
        twitter_handle: response.data.twitter_handle || ''
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setSaving(true);
    try {
      await api.post('/auth/resend-verification');
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox and junk/spam folder.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to resend verification email',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      // Only send email update for non-social logins
      const canChangeEmail = !session?.user?.provider || session.user.provider === 'local';
      
      const response = await api.put('/users/me', {
        username: formData.username !== userStats.username ? formData.username : undefined,
        email: (canChangeEmail && formData.email !== userStats.email) ? formData.email : undefined,
        email_notifications: formData.email_notifications,
        twitter_handle: formData.twitter_handle !== (userStats.twitter_handle || '') ? formData.twitter_handle : undefined
      });
      
      toast({
        title: 'Success',
        description: response.data.message
      });
      
      // Update session with new username
      if (formData.username !== userStats.username) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: formData.username
          }
        });
      }
      
      setUserStats(response.data.user);
      setEditMode(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/users/me/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      toast({
        title: 'Success',
        description: 'Password updated successfully'
      });
      
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(98,181,229)] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const showPasswordSection = !session.user?.provider || session.user?.provider === 'local';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center gap-3">
          <div className="bg-[rgb(98,181,229)]/10 p-3 rounded-xl">
            <User className="h-8 w-8 text-[rgb(98,181,229)]" />
          </div>
          My Profile
        </h1>
        <p className="text-gray-600">Manage your account settings and view your performance</p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center">
                Account Information
              </h2>
              {!editMode ? (
                <Button
                  onClick={() => setEditMode(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        username: userStats.username,
                        email: userStats.email,
                        email_notifications: userStats.email_notifications,
                        twitter_handle: userStats.twitter_handle || ''
                      });
                    }}
                    variant="outline"
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  {editMode ? (
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                      disabled={saving}
                    />
                  ) : (
                    <p className="font-medium text-lg">{userStats?.username}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {editMode && (!session.user?.provider || session.user?.provider === 'local') ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email"
                      disabled={saving}
                    />
                  ) : (
                    <div>
                      <p className="font-medium text-lg flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-500" />
                        {userStats?.email}
                      </p>
                      {userStats?.email_verified ? (
                        <p className="text-xs text-green-600 mt-1 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Email verified
                        </p>
                      ) : (
                        <div className="mt-2">
                          <p className="text-xs text-amber-600 mb-2">
                            ⚠️ Email not verified - You won't be able to submit predictions
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleResendVerification}
                            disabled={saving}
                            className="text-xs"
                          >
                            Resend Verification Email
                          </Button>
                        </div>
                      )}
                      {editMode && session.user?.provider && session.user?.provider !== 'local' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Email managed by {session.user.provider}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter Handle
                  </label>
                  {editMode ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                      <Input
                        value={formData.twitter_handle}
                        onChange={(e) => {
                          // Remove @ if user includes it
                          const value = e.target.value.replace('@', '');
                          setFormData({ ...formData, twitter_handle: value });
                        }}
                        placeholder="username"
                        disabled={saving}
                        className="pl-8"
                        maxLength={15}
                      />
                    </div>
                  ) : (
                    <div>
                      {userStats?.twitter_handle ? (
                        <p className="font-medium text-lg flex items-center">
                          <Twitter className="mr-2 h-4 w-4 text-[rgb(98,181,229)]" />
                          @{userStats.twitter_handle}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">Not set</p>
                      )}
                    </div>
                  )}
                  {editMode && (
                    <p className="text-xs text-gray-500 mt-1">
                      Used for importing historical predictions
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Notifications
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => editMode && setFormData({ ...formData, email_notifications: !formData.email_notifications })}
                    disabled={!editMode || saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      formData.email_notifications 
                        ? 'bg-[rgb(98,181,229)]/10 border-[rgb(98,181,229)] text-[rgb(98,181,229)]' 
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    } ${editMode && !saving ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'}`}
                  >
                    {formData.email_notifications ? (
                      <>
                        <Bell className="h-4 w-4" />
                        Notifications On
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4" />
                        Notifications Off
                      </>
                    )}
                  </button>
                  <span className="text-sm text-gray-600">
                    Receive email reminders about upcoming matches
                  </span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Since
                  </label>
                  <p className="font-medium flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    {userStats && new Date(userStats.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                {userStats?.is_admin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <p className="font-medium flex items-center text-[rgb(98,181,229)]">
                      <Shield className="mr-2 h-4 w-4" />
                      Administrator
                    </p>
                  </div>
                )}
              </div>
              
              {session.user?.image && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full border-2 border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="bg-yellow-100 p-2 rounded-lg mr-3">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </span>
                Season Performance
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <Trophy className="h-4 w-4 mr-2" />
                    Total Points
                  </span>
                  <span className="font-bold text-2xl text-[rgb(98,181,229)]">
                    {userStats?.total_points || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    League Position
                  </span>
                  <span className="font-bold text-xl">
                    {userStats?.position ? `#${userStats.position}` : 'Unranked'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Perfect Predictions
                  </span>
                  <span className="font-bold text-lg text-green-600">
                    {userStats?.correct_scores || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Correct Results
                  </span>
                  <span className="font-bold text-lg">
                    {userStats?.correct_results || 0}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <span className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Target className="h-5 w-5 text-purple-600" />
                </span>
                Prediction Stats
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Predictions</span>
                  <span className="font-bold text-lg">
                    {userStats?.predictions_made || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Current Streak</span>
                  <span className="font-bold text-lg flex items-center">
                    <Target className="mr-1 h-4 w-4 text-orange-500" />
                    {userStats?.current_streak || 0} games
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Best Streak</span>
                  <span className="font-bold text-lg flex items-center">
                    <Award className="mr-1 h-4 w-4 text-[rgb(98,181,229)]" />
                    {userStats?.best_streak || 0} games
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-bold text-lg">
                    {userStats?.predictions_made > 0 
                      ? `${Math.round(((userStats.correct_scores + userStats.correct_results) / userStats.predictions_made) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="bg-red-100 p-2 rounded-lg mr-3">
                <Lock className="h-5 w-5 text-red-600" />
              </span>
              Security Settings
            </h2>
            
            {showPasswordSection ? (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Enter current password"
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="Enter new password (min 8 characters)"
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                    disabled={saving}
                  />
                </div>
                
                <Button
                  onClick={handleChangePassword}
                  disabled={saving || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                  className="w-full"
                >
                  {saving ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  You signed in with {session.user?.provider}. Password management is handled by your provider.
                </p>
              </div>
            )}
            
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold mb-3">Login Method</h3>
              <p className="text-gray-600">
                {session.user?.provider 
                  ? `Signed in with ${session.user.provider.charAt(0).toUpperCase() + session.user.provider.slice(1)}` 
                  : 'Signed in with email and password'}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}