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

export interface BillingProduct {
  // Autumn product fields are dynamic; keep generic record
  [key: string]: unknown;
}

interface BillingState {
  summary: BillingSummary | null;
  product: BillingProduct | null;
  loading: boolean;
  error: string | null;
  setSummary: (summary: BillingSummary | null) => void;
  setProduct: (product: BillingProduct | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  summary: null,
  product: null,
  loading: true,
  error: null,
  setSummary: (summary) => set({ summary }),
  setProduct: (product) => set({ product }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
})); 