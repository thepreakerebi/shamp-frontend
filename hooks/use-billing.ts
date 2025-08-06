import { useCallback, useEffect } from "react";
import { useBillingStore } from "@/lib/store/billing";
import { useAuth } from "@/lib/auth";
import { apiFetch } from '@/lib/api-client';

export function useBilling() {
  const { currentWorkspaceId } = useAuth();
  const store = useBillingStore();

  const loadSummary = useCallback(async () => {
    if (!currentWorkspaceId) return;
    const initialLoad = !useBillingStore.getState().summary;
    if (initialLoad) {
      store.setLoading(true);
    }
    store.setError(null);
    try {
      const res = await apiFetch('/billing/summary', { workspaceId: currentWorkspaceId });
      const summary = await res.json();
      store.setSummary(summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch";
      store.setError(message);
    } finally {
      if (initialLoad) {
        store.setLoading(false);
      }
    }
  }, [currentWorkspaceId, store]);

  // auto fetch on mount or workspace change
  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspaceId]);

  // helper: check allowed
  const allowed = useCallback(
    ({ featureId, requiredBalance = 1 }: { featureId: string; requiredBalance?: number }) => {
      const { summary } = useBillingStore.getState();
      const features: unknown = summary?.features;
      let feature: unknown;
      if (Array.isArray(features)) {
        feature = features.find((f) => (f as { feature_id: string }).feature_id === featureId);
      } else if (features && typeof features === "object") {
        // record lookup
        feature = (features as Record<string, unknown>)[featureId];
      }
      if (!feature) return false;
      const f = feature as Record<string, unknown>;
      if (f.unlimited) return true;
      if (typeof f.balance === 'number') return f.balance >= requiredBalance;
      if ('allowed' in f && typeof f.allowed === 'boolean') {
        return Boolean(f.allowed);
      }
      return false;
    },
    []
  );

  const attachProductCheckout = useCallback(
    async ({ productId, forceCheckout = false }: { productId: string; forceCheckout?: boolean }): Promise<{ checkout_url?: string }> => {
      if (!currentWorkspaceId) throw new Error("No workspace context");
      const res = await apiFetch('/billing/attach-product', { workspaceId: currentWorkspaceId, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, forceCheckout }) });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create checkout session");
      }
      const json = await res.json();
      // After attaching, refresh summary to reflect new plan
      loadSummary();
      return json as { checkout_url?: string };
    },
    [currentWorkspaceId, loadSummary]
  );

  const getBillingPortalUrl = useCallback(async (): Promise<{ portal_url?: string }> => {
    if (!currentWorkspaceId) throw new Error("No workspace context");
    const res = await apiFetch('/billing/portal-url', { workspaceId: currentWorkspaceId, method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to create billing portal session");
    }
    const json = await res.json();
    return json as { portal_url?: string };
  }, [currentWorkspaceId]);

  const getProduct = useCallback(
    async (productId: string) => {
      const res = await apiFetch(`/billing/product/${productId}`);
      const product = await res.json();
      store.setProduct(product);
      return product;
    },
    [store]
  );

  return {
    ...store,
    refetch: loadSummary,
    allowed,
    attachProductCheckout,
    getBillingPortalUrl,
    getProduct,
  };
} 