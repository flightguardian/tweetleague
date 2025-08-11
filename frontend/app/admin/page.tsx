'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { FixtureManager } from '@/components/admin/fixture-manager';
import { ScoreUpdater } from '@/components/admin/score-updater';
import { AdminStats } from '@/components/admin/admin-stats';
import { SeasonManager } from '@/components/admin/season-manager';
import { Shield, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
    
    checkAdminStatus();
  }, [session, status, router]);

  const checkAdminStatus = async () => {
    try {
      // Temporary workaround - check if user is admin based on session
      if (session?.user?.email === 'gavmcbride90@gmail.com' || session?.user?.isAdmin) {
        setIsAdmin(true);
      } else {
        // Try to fetch admin stats - if it succeeds, user is admin
        await api.get('/admin/stats');
        setIsAdmin(true);
      }
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        // Not an admin or not authenticated
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-[rgb(98,181,229)] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center gap-3">
              <Shield className="h-10 w-10 text-[rgb(98,181,229)]" />
              Admin Panel
            </h1>
            <p className="text-gray-600">Manage fixtures, update scores, and view system statistics</p>
          </div>
          <Link href="/admin/test-scores">
            <Button variant="outline" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Test Scores
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <AdminStats />
      </div>

      <Tabs defaultValue="seasons" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="seasons">Seasons</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="scores">Update Scores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="seasons">
          <SeasonManager />
        </TabsContent>
        
        <TabsContent value="fixtures">
          <FixtureManager />
        </TabsContent>
        
        <TabsContent value="scores">
          <ScoreUpdater />
        </TabsContent>
      </Tabs>
    </div>
  );
}