'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '@/lib/api-client';

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
  signup: (data: SignupData) => Promise<string | undefined>;
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

// All API calls go through apiFetch; base URL is appended there.

// fetchWithToken helper removed – apiFetch handles credentials, CSRF and optional auth

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('currentWorkspaceId') : null
  );
  const [loading, setLoading] = useState(true);
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings | null>(null);
  const [workspaceAdmin, setWorkspaceAdmin] = useState<WorkspaceAdmin | null>(null);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);

  // On mount (and whenever token changes) try to fetch current user. If token is null we
  // still attempt – the backend may authenticate via HttpOnly cookie.
  useEffect(() => {
      apiFetch('/users/me', { token, workspaceId: currentWorkspaceId })
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
                  apiFetch('/users/workspace/max-agent-steps', { token, workspaceId: workspaceIdToUse }),
                  apiFetch('/users/workspace/admin', { token, workspaceId: workspaceIdToUse })
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
            localStorage.removeItem('currentWorkspaceId');
          }
        })
        .finally(() => setLoading(false));
  }, [token]);

  // Token persistence removed – cookies hold the session.

  // Keep the 'ws' cookie in sync with the current workspace – this is used by server components
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (currentWorkspaceId) {
      // 1-year expiry, SameSite Lax so it’s sent on same-site navigation and API calls
      document.cookie = `ws=${currentWorkspaceId}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    } else {
      // Clear cookie
      document.cookie = 'ws=; path=/; max-age=0; SameSite=Lax';
    }
  }, [currentWorkspaceId]);

  /* Silent session refresh disabled – cookie now valid for 24h.
     Keep code commented for potential future re-enable. */
   
  // Login method
  const login = async (email: string, password: string) => {
    setLoading(true);
    const res = await apiFetch('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) });
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
    setToken(authToken);
    
    // Fetch user info to get workspace context
    const userRes = await apiFetch('/users/me', { token });
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
          apiFetch('/users/workspace/max-agent-steps', { token, workspaceId: initialWorkspaceId }),
          apiFetch('/users/workspace/admin', { token, workspaceId: initialWorkspaceId })
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
  const signup = async (data: SignupData): Promise<string | undefined> => {
    setLoading(true);
    const res = await apiFetch('/users/create-account', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) {
      setLoading(false);
      throw new Error((await res.json()).error || 'Signup failed');
    }
    const json = await res.json();
    setLoading(false);
    const checkoutUrl: string | undefined = json?.checkoutUrl;
    return checkoutUrl;
  };

  // Update profile (first & last name)
  const updateProfile = async (changes: { firstName?: string; lastName?: string }) => {
    if (!user) throw new Error("Not authenticated");
    const res = await apiFetch(`/users/${user._id}`, { method: 'PUT', token, workspaceId: currentWorkspaceId, body: JSON.stringify(changes) });
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
    if (!currentWorkspaceId) throw new Error("Not authenticated or no workspace context");
    
    const res = await apiFetch('/users/workspace', { method: 'PUT', token, workspaceId: currentWorkspaceId, body: JSON.stringify(data) });
    
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
    const res = await apiFetch('/users/join-workspace', { method: 'POST', body: JSON.stringify({ token: inviteToken }), token });
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
      const res = await apiFetch('/users/seamless-join-workspace', { method: 'POST', body: JSON.stringify({ token: inviteToken }), headers: { 'Content-Type': 'application/json' } });
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
      setToken(authToken);

      if (workspaceIdFromToken) {
        setCurrentWorkspaceId(workspaceIdFromToken);
        localStorage.setItem('currentWorkspaceId', workspaceIdFromToken);
      }

      // Fetch full user info to populate context and workspace details
      const userRes = await apiFetch('/users/me', { token: authToken });
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
              apiFetch('/users/workspace/max-agent-steps', { token: authToken, workspaceId: wsId }),
              apiFetch('/users/workspace/admin', { token: authToken, workspaceId: wsId }),
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
    // token already cleared

    // Expire auth cookie client-side (best-effort)
    if (typeof document !== 'undefined') {
      document.cookie = 'auth=; path=/; max-age=0; SameSite=Lax;';
    }
  };

  // Refresh session (re-fetch user info)
  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    const res = await apiFetch('/users/me', { token, workspaceId: currentWorkspaceId });
    if (res.ok) {
      setUser(await res.json());
    } else {
      setUser(null);
      setToken(null);
      setCurrentWorkspaceId(null);
      localStorage.removeItem('currentWorkspaceId');
    }
    setLoading(false);
  };

  // Get current user info from backend
  const getUser = async () => {
    if (!token) return null;
    const res = await apiFetch('/users/me', { token, workspaceId: currentWorkspaceId });
    if (!res.ok) return null;
    return res.json();
  };

  // Accept invite
  const acceptInvite = async ({ token: inviteToken, firstName, lastName, password, profilePicture }: { token: string; firstName: string; lastName: string; password: string; profilePicture?: string }) => {
    setLoading(true);
    const res = await apiFetch('/users/accept-invite', { method: 'POST', body: JSON.stringify({ token: inviteToken, firstName, lastName, password, profilePicture }), token });
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
          apiFetch('/users/workspace/max-agent-steps', { token: authToken, workspaceId: initialWorkspaceId }),
          apiFetch('/users/workspace/admin', { token: authToken, workspaceId: initialWorkspaceId })
        ]);
      if (wsRes.ok) {
        setWorkspaceSettings(await wsRes.json());
      }
        if (adminRes.ok) {
          setWorkspaceAdmin(await adminRes.json());
        }
      } catch {}
    }

    // Ensure user context is fully updated before proceeding
    await refresh();
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