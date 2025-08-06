/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useBilling } from "@/hooks/use-billing";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function CreditsUsageCard() {
  const { summary, loading: billingLoading } = useBilling();

  // Determine active plan name (defaults to Free)
  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  // Show only for paid plans (hobby, pro, ultra, etc.)
  const paidPlans = ["hobby", "pro", "ultra", "beta", "hobby - annual", "pro - annual", "ultra - annual"];

  if (billingLoading) {
    return (
      <section className="px-3 mt-4 mb-3">
        <Skeleton className="h-24 w-full rounded-lg" />
      </section>
    );
  }

  if (!paidPlans.includes((planName ?? "").toLowerCase())) return null;

  // ---------------------------------------------------------------------------
  // Extract credits feature information
  // ---------------------------------------------------------------------------
  const features: unknown = summary?.features;
  let quotaFeature: any;
  const preferredIds = ["credits", "requests", "tests", "test_runs"];

  if (Array.isArray(features)) {
    quotaFeature = preferredIds
      .map((id) => features.find((f) => (f as any).feature_id === id))
      .find(Boolean) ||
      features.find((f) => typeof (f as any).included_usage === "number");
  } else if (features && typeof features === "object") {
    quotaFeature = preferredIds
      .map((id) => (features as Record<string, any>)[id])
      .find(Boolean) ||
      Object.values(features as Record<string, any>).find(
        (f: any) => typeof f?.included_usage === "number"
      );
  }

  if (!quotaFeature) return null;

  const included =
    typeof quotaFeature.included_usage === "number" ? quotaFeature.included_usage : undefined;
  const balance = typeof quotaFeature.balance === "number" ? quotaFeature.balance : undefined;

  const used =
    included !== undefined && balance !== undefined
      ? included - balance
      : typeof quotaFeature.usage === "number"
      ? quotaFeature.usage
      : undefined;

  // Guard: need both numbers to show progress
  if (included === undefined || used === undefined) return null;

  const percentage = Math.min(100, (used / included) * 100);

  // Next reset info (optional)
  let nextResetAt: number | undefined;
  if (typeof quotaFeature.next_reset_at === "number") {
    const raw = quotaFeature.next_reset_at;
    nextResetAt = raw > 1e12 ? raw : raw * 1000;
  }
  const nextResetDateStr = nextResetAt
    ? new Date(nextResetAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : undefined;

  return (
    <section className="px-3 mt-4 mb-3">
      <Link href="/pricing" className="block group">
        <section className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <span className="font-medium text-sm">Credits usage</span>
          <section className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {used} / {included}
            </span>
            <Progress value={percentage} />
            {nextResetDateStr && (
              <span className="text-[10px] text-muted-foreground">
                Next reset on: {nextResetDateStr}
              </span>
            )}
          </section>
        </section>
      </Link>
    </section>
  );
} 