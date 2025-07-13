/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useBilling } from "@/hooks/use-billing";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Separate card component prompting admins on the Free plan to upgrade.
// Additionally shows included request credits usage progress.
export function UpgradePlanCard() {
  const { summary, loading: billingLoading } = useBilling();

  // Determine active plan name (defaults to Free when none attached)
  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  // Show skeleton while loading
  if (billingLoading) {
    return (
      <section className="px-3 mt-4 mb-3">
        <Skeleton className="h-24 w-full rounded-lg" />
      </section>
    );
  }

  // Guard: only show on Free plan
  if ((planName ?? "").toLowerCase() !== "free") return null;

  /* -------------------------------------------------------------------------- */
  /*            Attempt to extract usage / quota for included requests           */
  /* -------------------------------------------------------------------------- */
  const features: unknown = summary?.features;
  let quotaFeature: any;

  // Prefer explicit feature identifiers; fall back to first with included_usage
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

  const included =
    quotaFeature && typeof quotaFeature.included_usage === "number"
      ? quotaFeature.included_usage
      : undefined;
  const balance =
    quotaFeature && typeof quotaFeature.balance === "number"
      ? quotaFeature.balance
      : undefined;

  const used =
    included !== undefined && balance !== undefined
      ? included - balance
      : quotaFeature && typeof quotaFeature.usage === "number"
      ? quotaFeature.usage
      : undefined;

  const percentage =
    included && used !== undefined ? Math.min(100, (used / included) * 100) : 0;

  // Next reset timestamp (Unix seconds) if provided by Autumn, to format date info
  let nextResetAt: number | undefined;
  if (quotaFeature && typeof quotaFeature.next_reset_at === "number") {
    const raw = quotaFeature.next_reset_at;
    // If the timestamp already looks like milliseconds (>= 10^12), keep as is; else assume seconds.
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
        <section className="flex flex-col gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          {/* Header */}
          <section className="flex items-start gap-3">
            <section className="bg-secondary/20 text-secondary rounded-md p-1">
              <Sparkles className="h-4 w-4" />
            </section>
            <section className="flex flex-col">
              <span className="font-medium text-sm">Upgrade plan</span>
              <span className="text-xs text-muted-foreground">
                Get more credits for more test runs and access to advanced features
              </span>
            </section>
          </section>

          {/* Usage progress */}
          {included && used !== undefined && (
            <section className="flex flex-col gap-1 mt-2">
              <span className="text-sm font-medium">
                {used} / {included}
              </span>
              <Progress value={percentage} />
              <span className="text-[10px] text-muted-foreground">
                {included} credits included in your plan.
                {nextResetDateStr && ` Next reset on: ${nextResetDateStr}`}
              </span>
            </section>
          )}
        </section>
      </Link>
    </section>
  );
} 