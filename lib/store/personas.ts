import { create } from "zustand";
import { Persona } from "@/hooks/use-personas";

interface PersonasState {
  personas: Persona[] | null;
  personasLoading: boolean;
  personasError: string | null;
  count: number;
  countLoading: boolean;
  countError: string | null;
  setPersonas: (personas: Persona[] | null) => void;
  setPersonasLoading: (loading: boolean) => void;
  setPersonasError: (error: string | null) => void;
  setCount: (count: number) => void;
  setCountLoading: (loading: boolean) => void;
  setCountError: (error: string | null) => void;
  updatePersonaInList: (persona: Persona) => void;
  removePersonaFromList: (id: string) => void;
  addPersonaToList: (persona: Persona) => void;
  addPersonasToList: (personas: Persona[]) => void;
  reset: () => void;
}

export const usePersonasStore = create<PersonasState>((set) => ({
  personas: null,
  personasLoading: true,
  personasError: null,
  count: 0,
  countLoading: true,
  countError: null,
  setPersonas: (personas) => set({ personas }),
  setPersonasLoading: (personasLoading) => set({ personasLoading }),
  setPersonasError: (personasError) => set({ personasError }),
  setCount: (count) => set({ count }),
  setCountLoading: (countLoading) => set({ countLoading }),
  setCountError: (countError) => set({ countError }),
  updatePersonaInList: (persona) =>
    set((state) => ({
      personas: state.personas
        ? state.personas.map((p) => (p._id === persona._id ? persona : p))
        : [persona],
    })),
  removePersonaFromList: (id) =>
    set((state) => ({
      personas: state.personas ? state.personas.filter((p) => p._id !== id) : null,
    })),
  addPersonaToList: (persona) =>
    set((state) => {
      if (state.personas && state.personas.some((p) => p._id === persona._id)) {
        // If already exists, replace it (might be newer data)
        return {
          personas: state.personas.map((p) => (p._id === persona._id ? persona : p)),
        };
      }
      return {
        personas: state.personas ? [persona, ...state.personas] : [persona],
      };
    }),
  addPersonasToList: (personas) =>
    set((state) => {
      const existingIds = new Set(state.personas?.map((p) => p._id) || []);
      const uniqueNew = personas.filter((p) => !existingIds.has(p._id));
      if (uniqueNew.length === 0) return state;
      return {
        personas: state.personas ? [...uniqueNew, ...state.personas] : uniqueNew,
      };
    }),
  reset: () =>
    set({
      personas: null,
      personasLoading: true,
      personasError: null,
      count: 0,
      countLoading: true,
      countError: null,
    }),
})); 