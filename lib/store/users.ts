import { create } from 'zustand';

export interface AppUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  joinedAt: string;
}

interface UsersState {
  users: AppUser[] | null;
  loading: boolean;
  error: string | null;
  setUsers: (u: AppUser[] | null) => void;
  addUser: (u: AppUser) => void;
  removeUser: (id: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: null,
  loading: true,
  error: null,
  setUsers: (users) => set({ users }),
  addUser: (u) => set((s) => ({ users: s.users ? [u, ...s.users] : [u] })),
  removeUser: (id) => set((s) => ({ users: s.users?.filter(u => u._id !== id) || null })),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
  reset: () => set({ users: null, loading: true, error: null }),
})); 