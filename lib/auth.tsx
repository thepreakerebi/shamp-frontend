'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  extraFields?: Record<string, unknown>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: SignupData) => Promise<void>;
  refresh: () => Promise<void>;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePicture?: string;
}

// Custom error for unverified email
export class EmailNotVerifiedError extends Error {
  constructor(message: string = 'Please verify your email address before logging in.') {
    super(message);
    this.name = 'EmailNotVerifiedError';
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function fetchWithToken(url: string, token: string | null, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  );
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider mounted, token:', token, 'API_BASE:', API_BASE);

  // On mount, try to fetch user if token exists
  useEffect(() => {
    if (token) {
      console.log('Fetching /users/me with token:', token);
      fetchWithToken(`${API_BASE}/users/me`, token)
        .then(async (res) => {
          console.log('Response from /users/me:', res.status);
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Login method
  const login = async (email: string, password: string) => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      setLoading(false);
      if (
        errorData.error &&
        typeof errorData.error === 'string' &&
        errorData.error.toLowerCase().includes('verify your email')
      ) {
        throw new EmailNotVerifiedError(errorData.error);
      }
      throw new Error(errorData.error || 'Login failed');
    }
    const authToken = res.headers.get('set-auth-token');
    if (!authToken) {
      setLoading(false);
      throw new Error('No auth token returned');
    }
    localStorage.setItem('authToken', authToken);
    setToken(authToken);
    // Fetch user info
    const userRes = await fetchWithToken(`${API_BASE}/users/me`, authToken);
    if (!userRes.ok) {
      setLoading(false);
      throw new Error('Failed to fetch user info');
    }
    setUser(await userRes.json());
    setLoading(false);
  };

  // Signup method
  const signup = async (data: SignupData) => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/users/create-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setLoading(false);
      throw new Error((await res.json()).error || 'Signup failed');
    }
    // Optionally, auto-login or prompt for email verification
    setLoading(false);
  };

  // Logout method
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  // Refresh session (re-fetch user info)
  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetchWithToken(`${API_BASE}/users/me`, token);
    if (res.ok) {
      setUser(await res.json());
    } else {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, signup, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}; 