'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader } from 'lucide-react';

export default function TwitterAuthSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store the token
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Redirect to home or profile
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else {
      // Error - redirect to login
      router.push('/login');
    }
  }, [searchParams, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader className="h-12 w-12 animate-spin text-[rgb(98,181,229)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Logging you in with X...</h1>
        <p className="text-gray-600">Please wait while we complete your login</p>
      </div>
    </div>
  );
}