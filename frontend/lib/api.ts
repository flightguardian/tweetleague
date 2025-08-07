import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Only add interceptor on client side
if (typeof window !== 'undefined') {
  api.interceptors.request.use(async (config) => {
    // First check localStorage (for regular login)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If no token in localStorage, check NextAuth session (for social login)
    else {
      try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      } catch (error) {
        // Session fetch failed, continue without token
      }
    }
    return config;
  });
}

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};