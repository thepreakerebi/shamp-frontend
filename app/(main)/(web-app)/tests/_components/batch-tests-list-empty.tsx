"use client";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Sparkles } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import { useBilling } from "@/hooks/use-billing";
import Link from "next/link";

export function BatchTestsListEmpty() {
  const router = useRouter();
  const { summary, loading: billingLoading } = useBilling();

  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  const isFreeOrHobby = ["free", "hobby"].includes((planName ?? "").toLowerCase());
  const canCreateBatch = billingLoading || !isFreeOrHobby;

  if (!canCreateBatch) {
    return (
      <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <Sparkles className="text-muted-foreground mb-2" size={40} />
        <h2 className="text-xl font-semibold text-foreground mb-1">Batch tests unavailable</h2>
        <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
          Batch tests are available on Pro and higher plans. Upgrade your plan to unlock this feature.
        </p>
        <Link href="/pricing">
          <Button className="gap-2" variant="default">
            <Plus className="size-4" /> Upgrade plan
          </Button>
        </Link>
      </section>
    );
  }

  const handleCreate = () => router.push("/tests/create-batch");

  return (
    <section className="flex flex-col items-center justify-center w-full py-16 gap-4 bg-background rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <ClipboardList className="text-muted-foreground mb-2" size={40} />
      <h2 className="text-xl font-semibold text-foreground mb-1">No batch tests found</h2>
      <p className="text-muted-foreground text-sm mb-4 text-center max-w-xs">
        You haven&apos;t created any batch tests yet. Create one to run a test across multiple personas simultaneously!
      </p>
      <Button onClick={handleCreate} className="gap-2" variant="default">
        <Plus className="size-4" />
        Create batch test
      </Button>
    </section>
  );
} 