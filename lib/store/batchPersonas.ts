import { create } from "zustand";
import type { BatchPersona } from "@/hooks/use-batch-personas";

interface BatchPersonasState {
  batchPersonas: BatchPersona[] | null;
  batchPersonasLoading: boolean;
  batchPersonasError: string | null;
  setBatchPersonas: (batchPersonas: BatchPersona[] | null) => void;
  setBatchPersonasLoading: (loading: boolean) => void;
  setBatchPersonasError: (error: string | null) => void;
  reset: () => void;
  updateBatchPersonaInList: (batch: BatchPersona) => void;
  addBatchPersonaToList: (batch: BatchPersona) => void;
  removeBatchPersonaFromList: (id: string) => void;
}

export const useBatchPersonasStore = create<BatchPersonasState>((set) => ({
  batchPersonas: null,
  batchPersonasLoading: true,
  batchPersonasError: null,
  setBatchPersonas: (batchPersonas) => set({ batchPersonas }),
  setBatchPersonasLoading: (batchPersonasLoading) => set({ batchPersonasLoading }),
  setBatchPersonasError: (batchPersonasError) => set({ batchPersonasError }),
  updateBatchPersonaInList: (batch) =>
    set((state) => ({
      batchPersonas: state.batchPersonas
        ? state.batchPersonas.map((b) => (b._id === batch._id ? batch : b))
        : [batch],
    })),
  addBatchPersonaToList: (batch) =>
    set((state) => ({
      batchPersonas: state.batchPersonas ? [batch, ...state.batchPersonas] : [batch],
    })),
  removeBatchPersonaFromList: (id) =>
    set((state) => ({
      batchPersonas: state.batchPersonas ? state.batchPersonas.filter((b) => b._id !== id) : null,
    })),
  reset: () => set({
    batchPersonas: null,
    batchPersonasLoading: true,
    batchPersonasError: null,
  }),
})); 