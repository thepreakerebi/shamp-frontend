import { useCallback, useEffect } from "react";
import { useBillingStore } from "@/lib/store/billing";
import { useAuth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const fetcher = async (
  endpoint: string,
  token: string,
  workspaceId?: string | null
) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { "X-Workspace-ID": workspaceId } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch");
  }
  return res.json();
};

export function useBilling() {
  const { token, currentWorkspaceId } = useAuth();
  const store = useBillingStore();

  const loadSummary = useCallback(async () => {
    if (!token || !currentWorkspaceId) return;
    store.setLoading(true);
    store.setError(null);
    try {
      const summary = await fetcher(
        "/billing/summary",
        token,
        currentWorkspaceId
      );
      store.setSummary(summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch";
      store.setError(message);
    } finally {
      store.setLoading(false);
    }
  }, [token, currentWorkspaceId, store]);

  // auto fetch on mount or workspace change
  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentWorkspaceId]);

  // helper: check allowed
  const allowed = useCallback(
    ({ featureId, requiredBalance = 1 }: { featureId: string; requiredBalance?: number }) => {
      const { summary } = useBillingStore.getState();
      const feature = summary?.features?.find((f) => f.feature_id === featureId);
      if (!feature) return false;
      if (feature.unlimited) return true;
      if (feature.balance !== undefined) return feature.balance >= requiredBalance;
      if ('allowed' in feature && typeof (feature as { allowed?: unknown }).allowed === 'boolean') {
        return Boolean((feature as { allowed?: boolean }).allowed);
      }
      return false;
    },
    []
  );

  const attachProductCheckout = useCallback(
    async ({ productId }: { productId: string }): Promise<{ checkout_url?: string }> => {
      if (!token || !currentWorkspaceId) {
        throw new Error("Not authenticated or workspace missing");
      }
      const res = await fetch(`${API_BASE}/billing/attach-product`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Workspace-ID": currentWorkspaceId,
        },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create checkout session");
      }
      const json = await res.json();
      // After attaching, refresh summary to reflect new plan
      loadSummary();
      return json as { checkout_url?: string };
    },
    [token, currentWorkspaceId, loadSummary]
  );

  return {
    ...store,
    refetch: loadSummary,
    allowed,
    attachProductCheckout,
  };
} 