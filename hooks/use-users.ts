import { useEffect, useCallback } from 'react';
import { useUsersStore } from '@/lib/store/users';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';

export function useUsers() {
  const { token, currentWorkspaceId } = useAuth();
  const store = useUsersStore();
  const { users, loading, error, setUsers, setLoading, setError, removeUser } = store;

  const fetchUsers = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/users', { token, workspaceId: currentWorkspaceId });
      if (!res.ok) {
        throw new Error((await res.json()).error || 'Failed to load users');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token, currentWorkspaceId, setLoading, setError, setUsers]);

  useEffect(() => { 
    if (users === null && currentWorkspaceId) {
      fetchUsers(); 
    }
  }, [users, fetchUsers, currentWorkspaceId]);

  const inviteMember = useCallback(async (payload: { email: string; }) => {
    if (!token || !currentWorkspaceId) throw new Error('Not authenticated or no workspace context');
    const res = await apiFetch('/users/invite', { token, workspaceId: currentWorkspaceId, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to send invite');
    const result = await res.json();
    toast.success(`Invite sent${result.userType ? ` (${result.userType})` : ''}`);
    return result;
  }, [token, currentWorkspaceId]);

  const deleteMember = useCallback(async (id: string) => {
    if (!token || !currentWorkspaceId) throw new Error('Not authenticated or no workspace context');
    const res = await apiFetch(`/users/${id}`, { token, workspaceId: currentWorkspaceId, method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete member');
    removeUser(id);
    toast.success('Member removed from workspace');
  }, [token, currentWorkspaceId, removeUser]);

  return { 
    users, 
    loading, 
    error, 
    refetch: fetchUsers, 
    inviteMember, 
    deleteMember,
    hasWorkspaceContext: !!currentWorkspaceId
  };
} 