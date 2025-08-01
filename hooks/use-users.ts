import { useEffect, useCallback } from 'react';
import { useUsersStore } from '@/lib/store/users';
import { useAuth } from '@/lib/auth';
import io from 'socket.io-client';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';

export function useUsers() {
  const { currentWorkspaceId } = useAuth();
  const store = useUsersStore();
  const { users, loading, error, setUsers, setLoading, setError, removeUser } = store;

  const fetchUsers = useCallback(async () => {
    if (!currentWorkspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/users', { workspaceId: currentWorkspaceId });
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
  }, [currentWorkspaceId, setLoading, setError, setUsers]);

  // Workspace tests status socket
  useEffect(()=>{
    if(!currentWorkspaceId) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, { transports:['websocket'], auth:{workspaceId: currentWorkspaceId} });
    socket.on('workspace:testsStatusUpdated', (payload: { workspace?: string; testsRunStatus: 'idle'|'running'|'paused'|'done' })=>{
      if(payload.workspace && payload.workspace!==currentWorkspaceId) return;
      store.setWorkspaceStatus(payload.testsRunStatus);
    });
    return () => { socket.disconnect(); };
  },[currentWorkspaceId, store]);

  useEffect(() => { 
    if (users === null && currentWorkspaceId) {
      fetchUsers(); 
    }
  }, [users, fetchUsers, currentWorkspaceId]);

  const inviteMember = useCallback(async (payload: { email: string; }) => {
    if (!currentWorkspaceId) throw new Error('No workspace context');
    const res = await apiFetch('/users/invite', { workspaceId: currentWorkspaceId, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to send invite');
    const result = await res.json();
    toast.success(`Invite sent${result.userType ? ` (${result.userType})` : ''}`);
    return result;
  }, [currentWorkspaceId]);

  const deleteMember = useCallback(async (id: string) => {
    if (!currentWorkspaceId) throw new Error('No workspace context');
    const res = await apiFetch(`/users/${id}`, { workspaceId: currentWorkspaceId, method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete member');
    removeUser(id);
    toast.success('Member removed from workspace');
  }, [currentWorkspaceId, removeUser]);

    const runWorkspaceTests = useCallback(async (testIds?: string[]) => {
    if (!currentWorkspaceId) throw new Error('No workspace context');
    const res = await apiFetch('/users/workspace/run-tests', {
      workspaceId: currentWorkspaceId,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testIds && testIds.length ? { testIds } : {}),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to start workspace tests');
    return res.json();
  }, [currentWorkspaceId]);

  const pauseWorkspaceTests = useCallback(async () => {
    if (!currentWorkspaceId) throw new Error('No workspace context');
    await apiFetch('/users/workspace/tests/pause', { workspaceId: currentWorkspaceId, method: 'PATCH' });
  }, [currentWorkspaceId]);

  const resumeWorkspaceTests = useCallback(async () => {
    if (!currentWorkspaceId) throw new Error('No workspace context');
    await apiFetch('/users/workspace/tests/resume', { workspaceId: currentWorkspaceId, method: 'PATCH' });
  }, [currentWorkspaceId]);

  const stopWorkspaceTests = useCallback(async () => {
    if (!currentWorkspaceId) throw new Error('No workspace context');
    await apiFetch('/users/workspace/tests/stop', { workspaceId: currentWorkspaceId, method: 'PATCH' });
  }, [currentWorkspaceId]);

  return { 
    users, 
    loading, 
    error, 
    refetch: fetchUsers, 
    inviteMember, 
    deleteMember,
    runWorkspaceTests,
    pauseWorkspaceTests,
    resumeWorkspaceTests,
    stopWorkspaceTests,
    workspaceTestsRunStatus: store.workspaceTestsRunStatus,
    setWorkspaceTestsRunStatus: store.setWorkspaceStatus,
    hasWorkspaceContext: !!currentWorkspaceId
  };
} 