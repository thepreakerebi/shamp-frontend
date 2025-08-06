"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button } from "@/components/ui/button";
import { useBilling } from "@/hooks/use-billing";
import { Check } from "lucide-react";
import { Loader2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: string;
  secondary?: string; // per month / per year label
  description: string;
  features: string[];
  popular?: boolean;
}

const monthlyPlans: Plan[] = [
  { id: "free", name: "Free", price: "$0", secondary: "per month", description: "Explore how Shamp helps with basic testing", features: ["100 credits / mo", "2 tests", "1 project", "2 personas", "Issues board", "AI insights"], },
  { id: "hobby", name: "Hobby", price: "$19.99", secondary: "per month", description: "Expanded limits for hobby projects", features: ["500 credits / mo", "10 tests", "5 projects", "15 personas", "Chat personas", "Advanced model", "Issues board", "Parallel runs", "AI insights"], },
  { id: "pro", name: "Pro", price: "$49.99", secondary: "per month", popular: true, description: "Advanced features & higher limits", features: ["1250 credits / mo", "35 tests", "15 projects", "30 personas", "Scheduled & recurring runs", "Device types", "Chat personas", "Advanced model", "Parallel runs", "AI insights"], },
  { id: "ultra", name: "Ultra", price: "$99.99", secondary: "per month", description: "Unlimited scale and full capabilities", features: ["2500 credits / mo", "Unlimited tests", "Unlimited projects", "Unlimited personas", "Batch personas & tests", "Scheduled & recurring runs", "Device types", "Chat personas", "Advanced model", "Parallel runs", "AI insights"], },
];

const annualPlans: Plan[] = [
  { id: "free", name: "Free", price: "$0", secondary: "$0 / mo", description: monthlyPlans[0].description, features: monthlyPlans[0].features },
  { id: "hobby_annual", name: "Hobby", price: "$203.90", secondary: "$16.99 / mo (billed yearly)", description: monthlyPlans[1].description, features: monthlyPlans[1].features },
  { id: "pro_annual", name: "Pro", price: "$509.90", secondary: "$42.49 / mo (billed yearly)", popular: true, description: monthlyPlans[2].description, features: monthlyPlans[2].features },
  // Limited-time promotional plan for beta users
  { id: "ultra_annual", name: "Ultra", price: "$1,019.90", secondary: "$84.99 / mo (billed yearly)", description: monthlyPlans[3].description, features: monthlyPlans[3].features },
];

export default function PricingPage() {
  const { attachProductCheckout, summary, refetch } = useBilling();

  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');

  // Initialise default tab once, based on current active product
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return; // already initialised – don't override user choice
    if (!summary?.products || !Array.isArray(summary.products)) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active = (summary.products as any[]).find((p: any) => p.status === 'active');
    if (!active) return;
    const idOrName = (active.id ?? active.name ?? '') as string;
    if (/(_annual$|\s-\s*annual$)/i.test(idOrName)) {
      setBillingCycle('year');
    } else {
      setBillingCycle('month');
    }
    initRef.current = true;
  }, [summary]);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const displayedPlans = billingCycle === 'month' ? monthlyPlans : annualPlans;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeProduct = useMemo(() => (summary?.products as any[])?.find((p: any) => p.status === 'active'), [summary]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scheduledProduct = useMemo(() => (summary?.products as any[])?.find((p: any) => p.status === 'scheduled'), [summary]);

  const activeProductId = activeProduct?.id ?? 'free';

  const parsePrice = (price: string) => {
    const match = price.match(/\d+(?:\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  const activePrice = parsePrice((displayedPlans.find(p=>p.id===activeProductId)?.price) || '0');

  const handleCheckout = async (
    clickedPlanId: string,
    productIdToAttach: string = clickedPlanId,
    isCancelScheduled: boolean = false,
  ) => {
    if (loadingPlanId) return; // prevent double clicks
    setLoadingPlanId(clickedPlanId);
    try {
      const forceFlag = clickedPlanId === 'beta';
      const { checkout_url } = await attachProductCheckout({ productId: productIdToAttach, forceCheckout: forceFlag });
      if (checkout_url) {
        toast.success('Redirecting to secure checkout…');
        window.location.href = checkout_url;
        return;
      }

      // No checkout URL returned ⇒ either downgrade scheduled or cancel action.
      await refetch();

      if (isCancelScheduled) {
        toast.success('Scheduled change cancelled – your current plan will remain active.');
      } else {
        const selected = displayedPlans.find(p=>p.id===productIdToAttach) as Plan | undefined;
        const isDowngrade = selected ? parsePrice(selected.price) < activePrice : false;
        if (isDowngrade) {
          toast.success('Downgrade scheduled for next billing cycle.');
        } else {
          toast.success('Plan upgraded successfully!');
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoadingPlanId(null);
      // refresh summary regardless
      try { await refetch(); } catch {}
    }
  };

  return (
    <section className="max-w-6xl mx-auto p-4 text-center">
      <h1 className="text-3xl font-medium mb-8">Upgrade your plan</h1>

      {/* Billing cycle toggle */}
      <section className="inline-flex mb-8 rounded-lg border overflow-hidden" role="tablist">
        {(['month','year'] as const).map(c => (
          <button
            key={c}
            className={cn('px-4 py-2 text-sm font-normal', billingCycle===c ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium' : 'bg-background text-foreground hover:bg-muted')}
            onClick={() => {
              setBillingCycle(c);
            }}
          >
            {c === 'month' ? 'Monthly' : 'Annual (save 15%)'}
          </button>
        ))}
      </section>

      {/* Plans */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list">
        {displayedPlans.map((plan) => {
          const isCurrent = plan.id === activeProductId;
          const isScheduled = scheduledProduct && scheduledProduct.id === plan.id;
          const highlightPopular = plan.popular && (
            (billingCycle === 'month' && activeProductId !== 'ultra') ||
            (billingCycle === 'year' && activeProductId !== 'ultra_annual')
          );
          return (
            <article
              key={plan.id}
              className={cn(
                "rounded-3xl border p-6 flex flex-col items-stretch text-left",
                highlightPopular && "border ring-2 ring-secondary/30 shadow",
              )}
            >
              <h2 className="text-xl font-medium mb-2 flex items-center gap-2">
                {plan.name}
                {plan.popular && (
                  <span className="text-xs px-2 py-0.5 bg-secondary/20 text-neutral-700 dark:text-neutral-300 rounded-full">POPULAR</span>
                )}
              </h2>
              <p className="text-4xl font-bold mb-1">{plan.price}</p>
              {plan.secondary && <p className="text-sm text-muted-foreground mb-4">{plan.secondary}</p>}
              <p className="text-sm mb-6 text-muted-foreground min-h-[48px]">{plan.description}</p>

              <Button
                variant={highlightPopular ? "secondary" : isCurrent ? "secondary" : isScheduled ? "outline" : "outline"}
                className={cn(
                  "w-full",
                  isCurrent && "bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-800"
                )}
                disabled={isCurrent || loadingPlanId !== null}
                onClick={isCurrent ? undefined : (
                  isScheduled
                    ? () => handleCheckout(plan.id, activeProductId, true)
                    : () => handleCheckout(plan.id)
                )}
              >
                {isCurrent ? (
                  "Your current plan"
                ) : isScheduled ? (
                  loadingPlanId === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel scheduled"
                ) : loadingPlanId === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  plan.price === "$0" ? "Get started" : `Get ${plan.name}`
                )}
              </Button>

              {/* Scheduled info */}
              {isScheduled && scheduledProduct?.started_at && (
                <p className="text-sm my-2 text-secondary font-medium">
                  Starts on {new Date(scheduledProduct.started_at).toLocaleDateString()}
                </p>
              )}

              <ul className="flex-1 my-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>

              
            </article>
          );
        })}
      </section>

      {/* Team banner */}
      <section className="mt-12" aria-label="Team plan banner">
        <section className="flex items-center justify-between gap-4 rounded-3xl bg-muted/70 dark:bg-muted/50 px-6 py-4 text-left">
          {/* Left content */}
          <section className="flex items-center gap-4">
            <span className="inline-flex items-center justify-center rounded-lg bg-background/60 border p-2">
              <Building2 className="w-5 h-5 text-foreground" />
            </span>
            <section>
              <h3 className="text-lg font-medium">Enterprise</h3>
              <p className="text-sm text-muted-foreground">Scale your product&apos;s experience with Shamp</p>
            </section>
          </section>

          {/* Action */}
          <section className="flex items-center gap-3">
            {activeProductId !== "beta" && (scheduledProduct?.id !== "beta") && (
              <Button
                variant="outline"
                disabled={loadingPlanId !== null}
                onClick={() => handleCheckout("beta")}
              >
                {loadingPlanId === "beta" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Get 1 year Pro access for $50"
                )}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.open("https://cal.com/thepreakerebi/custom-plan", "_blank", "noopener,noreferrer");
                }
              }}
            >
              Contact us
            </Button>
          </section>
        </section>
      </section>
    </section>
  );
} 