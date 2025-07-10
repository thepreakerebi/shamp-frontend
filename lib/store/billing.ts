import { create } from "zustand";

export interface BillingFeature {
  feature_id: string;
  unlimited?: boolean;
  interval?: string;
  balance?: number;
  usage?: number;
  included_usage?: number;
  next_reset_at?: number;
  // Additional fields can appear, keep generic record
  [key: string]: unknown;
}

export interface BillingSummary {
  products?: unknown[];
  features?: BillingFeature[];
  // other Autumn summary fields
  [key: string]: unknown;
}

interface BillingState {
  summary: BillingSummary | null;
  loading: boolean;
  error: string | null;
  setSummary: (summary: BillingSummary | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  summary: null,
  loading: true,
  error: null,
  setSummary: (summary) => set({ summary }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
})); 