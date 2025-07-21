"use client";

import { useEffect, useMemo, useState } from "react";
import { useBilling } from "@/hooks/use-billing";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function SubscriptionSection() {
  const { summary, loading: billingLoading, getProduct, product, getBillingPortalUrl } = useBilling();

  const [portalLoading, setPortalLoading] = useState(false);

  // ---------------------------------------------------------------------
  // Determine current plan and fetch full product details
  // ---------------------------------------------------------------------
  const currentProductId = (summary?.products?.[0] as { id?: string })?.id ?? "free";
  const planName = (summary?.products?.[0] as { name?: string })?.name || currentProductId;

  // Fetch product details only if user is admin
  const { user } = useAuth();
  const isAdmin = user?.currentWorkspaceRole === 'admin';

  useEffect(() => {
    if (isAdmin && currentProductId && !product) {
      getProduct(currentProductId).catch(() => void 0);
    }
  }, [currentProductId, product, getProduct, isAdmin]);

  // ---------------------------------------------------------------------
  // Credits usage calculation (same logic as CreditsUsageCard)
  // ---------------------------------------------------------------------
  // Detect plan changes to trigger toast on home page
  useEffect(() => {
    if (!summary) return;
    const prevPlanId = typeof window !== 'undefined' ? localStorage.getItem('planId') : null;
    const currentPlanId = currentProductId;

    if (prevPlanId && prevPlanId !== currentPlanId) {
      // Plan has changed – set flag for toast
      if (typeof window !== 'undefined') {
        localStorage.setItem('showPlanToast', '1');
      }
    }
    // Always store latest plan id
    if (typeof window !== 'undefined') {
      localStorage.setItem('planId', currentPlanId);
    }
  }, [summary, currentProductId]);

  const creditsInfo = useMemo(() => {
    if (!summary) return null;

    const features: unknown = summary.features;
    const preferredIds = ["credits", "requests", "tests", "test_runs"];
    let quotaFeature: unknown;

    if (Array.isArray(features)) {
      quotaFeature = preferredIds
        .map((id) => features.find((f) => (f as Record<string, unknown>).feature_id === id))
        .find(Boolean) ||
        features.find((f) => typeof (f as Record<string, unknown>).included_usage === "number");
    } else if (features && typeof features === "object") {
      quotaFeature = preferredIds
        .map((id) => (features as Record<string, unknown>)[id])
        .find(Boolean) ||
        Object.values(features as Record<string, unknown>).find(
          (f) => typeof (f as Record<string, unknown>).included_usage === "number"
        );
    }

    if (!quotaFeature) return null;

    const included =
      typeof (quotaFeature as Record<string, unknown>).included_usage === "number"
        ? (quotaFeature as Record<string, unknown>).included_usage as number
        : undefined;
    const balance =
      typeof (quotaFeature as Record<string, unknown>).balance === "number"
        ? (quotaFeature as Record<string, unknown>).balance as number
        : undefined;

    const used =
      included !== undefined && balance !== undefined
        ? included - balance
        : typeof (quotaFeature as Record<string, unknown>).usage === "number"
        ? ((quotaFeature as Record<string, unknown>).usage as number)
        : undefined;

    if (included === undefined || used === undefined) return null;

    const percentage = Math.min(100, (used / included) * 100);

    // next reset date
    let nextResetAt: number | undefined;
    if (typeof (quotaFeature as Record<string, unknown>).next_reset_at === "number") {
      const raw = (quotaFeature as Record<string, unknown>).next_reset_at as number;
      nextResetAt = raw > 1e12 ? raw : raw * 1000;
    }
    const nextResetDateStr = nextResetAt
      ? new Date(nextResetAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : undefined;

    return {
      included,
      used,
      percentage,
      nextResetDateStr,
    };
  }, [summary]);

  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------

  return (
    <section className="p-4 space-y-6">
      <h2 className="text-xl font-semibold">Subscription &amp; Usage</h2>

      {/* Credits Usage */}
      {billingLoading ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : creditsInfo ? (
        <section className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50">
          <span className="font-medium text-sm">Credits usage</span>
          <section className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {creditsInfo.used} / {creditsInfo.included}
            </span>
            <Progress value={creditsInfo.percentage} />
            {creditsInfo.nextResetDateStr && (
              <span className="text-[10px] text-muted-foreground">
                Next reset on: {creditsInfo.nextResetDateStr}
              </span>
            )}
          </section>
        </section>
      ) : null}

      {/* Manage subscription button (admins only) */}
      {isAdmin && (
      <Button
        variant="secondary"
        disabled={portalLoading}
        onClick={async () => {
          if (portalLoading) return;
          setPortalLoading(true);
          try {
            const { portal_url } = await getBillingPortalUrl();
            if (portal_url) {
              window.open(portal_url, "_blank");
            }
          } catch (err) {
            console.error(err);
            // fallback to pricing page in new tab
            window.open("/pricing", "_blank");
          } finally {
            setPortalLoading(false);
          }
        }}
      >
        {portalLoading ? "Opening…" : "Manage subscription"}
      </Button>) }

      {/* Current Plan Details */}
      <section className="mt-4 p-4 rounded-lg border space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          Current plan: {planName}
        </h3>

        {/* Product detail list */}
        {product ? (
          <ul className="space-y-2">
            {Array.isArray((product as Record<string, unknown>).items)
              ? ((product as Record<string, unknown>).items as unknown[]).map((item, idx) => {
                  const rec = item as Record<string, unknown>;
                  // Skip base price items (type === 'price')
                  if (rec.type === 'price') return null;

                  // Prefer display.primary_text if available
                  const display = rec.display as { primary_text?: string } | undefined;
                  let text: string | undefined = display?.primary_text;

                  if (!text) {
                    const included = rec.included_usage as number | undefined;
                    const label = (rec.feature_id as string | undefined) || '';
                    text = typeof included === 'number' ? `${included} ${label}` : label;
                  }

                  if (!text) return null;

                  return (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      {text}
                    </li>
                  );
                })
              : null}
          </ul>
        ) : billingLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <p className="text-sm text-muted-foreground">
            Plan details are available for workspace administrators.
          </p>
        )}
      </section>
    </section>
  );
} 