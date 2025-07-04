'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  _id: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  provider?: string;
  emailVerified?: boolean;
  defaultWorkspace?: {
    _id: string;
    name: string;
  };
  // New workspace context fields from getCurrentUser
  currentWorkspace?: {
    _id: string;
    name: string;
    ownerId: string;
  } | null;
  currentWorkspaceRole?: 'admin' | 'member' | null;
  workspaces?: Array<{
    _id: string;
    name: string;
    role: 'admin' | 'member';
    isOwner: boolean;
    joinedAt: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  switchingWorkspace: boolean;
  currentWorkspaceId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: SignupData) => Promise<void>;
  refresh: () => Promise<void>;
  getUser: () => Promise<User | null>;
  updateProfile: (changes: { firstName?: string; lastName?: string }) => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  workspaceSettings: WorkspaceSettings | null;
  workspaceAdmin: WorkspaceAdmin | null;
  updateWorkspace: (data: { name?: string; description?: string; maxAgentStepsDefault?: number }) => Promise<void>;
  acceptInvite: (data: { token: string; firstName: string; lastName: string; password: string; profilePicture?: string }) => Promise<void>;
  joinWorkspace: (token: string) => Promise<void>;
  seamlessJoinWorkspace: (inviteToken: string) => Promise<{ message: string; workspaceName?: string; inviterName?: string; } | void>;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePicture?: string;
}

interface WorkspaceSettings {
  maxAgentStepsDefault: number;
}

interface WorkspaceAdmin {
  firstName?: string;
  lastName?: string;
  email?: string;
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

async function fetchWithToken(url: string, token: string | null, workspaceId?: string | null, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add existing headers from options if they are properly typed
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  if (workspaceId) {
    headers['X-Workspace-ID'] = workspaceId;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  );
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('currentWorkspaceId') : null
  );
  const [loading, setLoading] = useState(true);
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings | null>(null);
  const [workspaceAdmin, setWorkspaceAdmin] = useState<WorkspaceAdmin | null>(null);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);

  // On mount, try to fetch user if token exists
  useEffect(() => {
    if (token) {
      fetchWithToken(`${API_BASE}/users/me`, token, currentWorkspaceId)
        .then(async (res) => {
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            
            // Set current workspace if not set or if user doesn't have access to current workspace
            if (!currentWorkspaceId || !userData.workspaces?.find((ws: { _id: string }) => ws._id === currentWorkspaceId)) {
              const newWorkspaceId = userData.currentWorkspace?._id || userData.defaultWorkspace?._id || userData.workspaces?.[0]?._id;
              if (newWorkspaceId) {
                setCurrentWorkspaceId(newWorkspaceId);
                localStorage.setItem('currentWorkspaceId', newWorkspaceId);
              }
            }
            
            // fetch workspace settings and admin info in parallel if we have workspace context
            if (currentWorkspaceId || userData.currentWorkspace?._id) {
              const workspaceIdToUse = currentWorkspaceId || userData.currentWorkspace?._id;
              try {
                const [wsRes, adminRes] = await Promise.all([
                  fetchWithToken(`${API_BASE}/users/workspace/max-agent-steps`, token, workspaceIdToUse),
                  fetchWithToken(`${API_BASE}/users/workspace/admin`, token, workspaceIdToUse)
                ]);
              if (wsRes.ok) {
                const wsData = await wsRes.json();
                setWorkspaceSettings(wsData);
              }
                if (adminRes.ok) {
                  const adminData = await adminRes.json();
                  setWorkspaceAdmin(adminData);
                }
            } catch {}
            }
          } else {
            setUser(null);
            setToken(null);
            setCurrentWorkspaceId(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentWorkspaceId');
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
    
    // Fetch user info to get workspace context
    const userRes = await fetchWithToken(`${API_BASE}/users/me`, authToken);
    if (!userRes.ok) {
      setLoading(false);
      throw new Error('Failed to fetch user info');
    }
    const userData = await userRes.json();
    setUser(userData);
    
    // Set initial workspace
    const initialWorkspaceId = userData.currentWorkspace?._id || userData.defaultWorkspace?._id || userData.workspaces?.[0]?._id;
    if (initialWorkspaceId) {
      setCurrentWorkspaceId(initialWorkspaceId);
      localStorage.setItem('currentWorkspaceId', initialWorkspaceId);
      
      // Fetch workspace-specific data
      try {
        const [wsRes, adminRes] = await Promise.all([
          fetchWithToken(`${API_BASE}/users/workspace/max-agent-steps`, authToken, initialWorkspaceId),
          fetchWithToken(`${API_BASE}/users/workspace/admin`, authToken, initialWorkspaceId)
        ]);
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkspaceSettings(wsData);
      }
        if (adminRes.ok) {
          const adminData = await adminRes.json();
          setWorkspaceAdmin(adminData);
        }
    } catch {}
    }
    setLoading(false);
  };

  // Switch workspace
  const switchWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    localStorage.setItem('currentWorkspaceId', workspaceId);
    
    // Set loading state briefly before refresh
    setLoading(true);
    setSwitchingWorkspace(true);
    
    // Trigger page refresh to load with new workspace context
    if (typeof window !== 'undefined') {
      // Small delay to allow loading state to show
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
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

  // Update profile (first & last name)
  const updateProfile = async (changes: { firstName?: string; lastName?: string }) => {
    if (!token || !user) throw new Error("Not authenticated");
    const res = await fetchWithToken(`${API_BASE}/users/${user._id}`, token, currentWorkspaceId, {
      method: 'PUT',
      body: JSON.stringify(changes),
    });
    if (!res.ok) {
      throw new Error((await res.json()).error || 'Failed to update profile');
    }
    const updated = await res.json();
    setUser(prev => ({ ...prev, ...updated }));
    
    // If this is a workspace admin, also update workspaceAdmin to reflect changes in sidebar
    if (user.currentWorkspaceRole === 'admin') {
      setWorkspaceAdmin(prev => ({
        ...prev,
        firstName: updated.firstName,
        lastName: updated.lastName,
      }));
    }
  };

  // Update workspace settings
  const updateWorkspace = async (data: { name?: string; description?: string; maxAgentStepsDefault?: number }) => {
    if (!token || !currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    
    const res = await fetchWithToken(`${API_BASE}/users/workspace`, token, currentWorkspaceId, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update workspace');
    }
    const workspaceData = await res.json();
    
    // Update workspace settings if maxAgentStepsDefault was changed
    if (data.maxAgentStepsDefault !== undefined) {
      setWorkspaceSettings(prev => ({
        ...prev,
        maxAgentStepsDefault: workspaceData.maxAgentStepsDefault
      }));
    }
    
    // Update user state directly with new workspace name if it was changed
    if (data.name !== undefined && user && user.currentWorkspace) {
      setUser(prev => {
        if (!prev || !prev.currentWorkspace) return prev;
        
        return {
          ...prev,
          currentWorkspace: {
            ...prev.currentWorkspace,
            name: workspaceData.name
          },
          workspaces: prev.workspaces?.map(ws => 
            ws._id === currentWorkspaceId ? { ...ws, name: workspaceData.name } : ws
          ) || prev.workspaces
        };
      });
    }
    
    return workspaceData;
  };

  // Join workspace via invite (for existing users)
  const joinWorkspace = async (inviteToken: string) => {
    if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_BASE}/users/join-workspace`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token: inviteToken }),
    });
    if (!res.ok) {
      throw new Error((await res.json()).error || 'Failed to join workspace');
    }
    const data = await res.json();
    
    // Refresh user data to get updated workspace list
    await refresh();
    
    return data;
  };

  // Seamless join workspace via invite without prior authentication
  const seamlessJoinWorkspace = async (inviteToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/seamless-join-workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to join workspace');
      }

      const data = await res.json();
      const authToken: string | undefined = data.token;
      if (!authToken) throw new Error('No auth token returned');

      // Extract workspaceId from invite token so we can switch context right away
      let workspaceIdFromToken: string | undefined;
      try {
        const [, payload] = inviteToken.split('.') as [string,string?];
        if (payload) {
          const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
          workspaceIdFromToken = decoded?.workspaceId;
        }
      } catch {}

      // Store token and update state
      localStorage.setItem('authToken', authToken);
      setToken(authToken);

      if (workspaceIdFromToken) {
        setCurrentWorkspaceId(workspaceIdFromToken);
        localStorage.setItem('currentWorkspaceId', workspaceIdFromToken);
      }

      // Fetch full user info to populate context and workspace details
      const userRes = await fetchWithToken(`${API_BASE}/users/me`, authToken);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);

        // Determine initial workspace ID, prefer the workspace we just joined
        const wsId = workspaceIdFromToken || userData.currentWorkspace?._id || userData.defaultWorkspace?._id || userData.workspaces?.[0]?._id;
        if (wsId) {
          setCurrentWorkspaceId(wsId);
          localStorage.setItem('currentWorkspaceId', wsId);
          
          // Fetch workspace specific settings & admin info
          try {
            const [wsRes, adminRes] = await Promise.all([
              fetchWithToken(`${API_BASE}/users/workspace/max-agent-steps`, authToken, wsId),
              fetchWithToken(`${API_BASE}/users/workspace/admin`, authToken, wsId),
            ]);
            if (wsRes.ok) setWorkspaceSettings(await wsRes.json());
            if (adminRes.ok) setWorkspaceAdmin(await adminRes.json());
          } catch {}
        }
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  // Logout method
  const logout = () => {
    setUser(null);
    setToken(null);
    setCurrentWorkspaceId(null);
    setWorkspaceSettings(null);
    setWorkspaceAdmin(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentWorkspaceId');
  };

  // Refresh session (re-fetch user info)
  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetchWithToken(`${API_BASE}/users/me`, token, currentWorkspaceId);
    if (res.ok) {
      setUser(await res.json());
    } else {
      setUser(null);
      setToken(null);
      setCurrentWorkspaceId(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentWorkspaceId');
    }
    setLoading(false);
  };

  // Get current user info from backend
  const getUser = async () => {
    if (!token) return null;
    const res = await fetchWithToken(`${API_BASE}/users/me`, token, currentWorkspaceId);
    if (!res.ok) return null;
    return res.json();
  };

  // Accept invite
  const acceptInvite = async ({ token: inviteToken, firstName, lastName, password, profilePicture }: { token: string; firstName: string; lastName: string; password: string; profilePicture?: string }) => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/users/accept-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteToken, firstName, lastName, password, profilePicture }),
    });
    if (!res.ok) {
      setLoading(false);
      throw new Error((await res.json()).error || 'Failed to accept invite');
    }
    const data = await res.json();
    const authToken = data.token;
    if (!authToken) {
      setLoading(false);
      throw new Error('No auth token returned');
    }
    localStorage.setItem('authToken', authToken);
    setToken(authToken);
    setUser(data.user);
    
    // Set initial workspace from user data
    const initialWorkspaceId = data.user.currentWorkspace?._id || data.user.defaultWorkspace?._id || data.user.workspaces?.[0]?._id;
    if (initialWorkspaceId) {
      setCurrentWorkspaceId(initialWorkspaceId);
      localStorage.setItem('currentWorkspaceId', initialWorkspaceId);
      
      // fetch workspace settings and admin info
      try {
        const [wsRes, adminRes] = await Promise.all([
          fetchWithToken(`${API_BASE}/users/workspace/max-agent-steps`, authToken, initialWorkspaceId),
          fetchWithToken(`${API_BASE}/users/workspace/admin`, authToken, initialWorkspaceId)
        ]);
      if (wsRes.ok) {
        setWorkspaceSettings(await wsRes.json());
      }
        if (adminRes.ok) {
          setWorkspaceAdmin(await adminRes.json());
        }
    } catch {}
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      switchingWorkspace,
      currentWorkspaceId,
      login, 
      logout, 
      signup, 
      refresh, 
      getUser, 
      updateProfile, 
      switchWorkspace,
      workspaceSettings, 
      workspaceAdmin, 
      updateWorkspace, 
      acceptInvite,
      joinWorkspace,
      seamlessJoinWorkspace
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 