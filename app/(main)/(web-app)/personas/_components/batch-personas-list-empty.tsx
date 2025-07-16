"use client";
import { Button } from "@/components/ui/button";
import { Users, Plus, Sparkles } from "lucide-react";
import React from "react";
import { useBilling } from "@/hooks/use-billing";
import Link from "next/link";

export function BatchPersonasListEmpty({ onCreate }: { onCreate?: () => void }) {
  const { summary, loading: billingLoading } = useBilling();

  // Determine active plan name (defaults to Free when none attached)
  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  // Treat annual variants (e.g. hobby_annual, Hobby - Annual) the same as the base plan
  const normalizedPlan = (planName ?? '')
    .toLowerCase()
    .replace(/(_annual$|\s-\s*annual$)/, '');
  const isFreeOrHobby = !billingLoading && ['free', 'hobby', 'pro'].includes(normalizedPlan);

  // If billing info still loading, assume feature available to avoid flicker
  const canCreateBatch = billingLoading || !isFreeOrHobby;

  if (!canCreateBatch) {
    return (
      <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <Sparkles className="text-muted-foreground mb-2" size={40} />
        <h2 className="text-xl font-semibold text-foreground mb-1">Batch personas unavailable</h2>
        <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
          Batch personas are available on Ultra plans. Upgrade your plan to unlock this feature.
        </p>
        <Link href="/pricing">
          <Button className="gap-2" variant="default">
            <Plus className="size-4" /> Upgrade plan
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <Users className="text-muted-foreground mb-2" size={40} />
      <h2 className="text-xl font-semibold text-foreground mb-1">No batch personas found</h2>
      <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
        You haven&apos;t created any batch personas yet. Start by generating a batch to get started!
      </p>
      <Button onClick={onCreate} className="gap-2" variant="default">
        <Plus className="size-4" />
        Create batch personas
      </Button>
    </section>
  );
} 