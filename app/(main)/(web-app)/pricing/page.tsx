"use client";

import { Button } from "@/components/ui/button";
import { useBilling } from "@/hooks/use-billing";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  { id: "free", name: "Free", price: "$0", secondary: "", description: "Explore how Shamp helps with basic testing", features: ["150 credits / mo", "2 tests", "1 project", "2 personas", "Issues board", "AI insights"], },
  { id: "hobby", name: "Hobby", price: "$50", secondary: "per month", description: "Expanded limits for hobby projects", features: ["1,200 credits / mo (then $0.06 ea)", "10 tests", "5 projects", "15 personas", "Chat personas", "Issues board", "AI insights"], },
  { id: "pro", name: "Pro", price: "$199", secondary: "per month", popular: true, description: "Advanced features & higher limits", features: ["3,000 credits / mo", "35 tests", "15 projects", "30 personas", "Batch personas & tests", "Scheduled & recurring runs", "Custom device types", "Chat personas", "AI insights"], },
  { id: "ultra", name: "Ultra", price: "$499", secondary: "per month", description: "Unlimited scale and full capabilities", features: ["8,000 credits / mo", "Unlimited tests", "Unlimited projects", "Unlimited personas", "Batch personas & tests", "Scheduled & recurring runs", "Device types", "AI insights"], },
];

const annualPlans: Plan[] = [
  { id: "free", name: "Free", price: "$0", secondary: "", description: monthlyPlans[0].description, features: monthlyPlans[0].features },
  { id: "hobby_annual", name: "Hobby", price: "$510", secondary: "$42.5 / mo (billed yearly)", description: monthlyPlans[1].description, features: monthlyPlans[1].features },
  { id: "pro_annual", name: "Pro", price: "$2,029", secondary: "$169 / mo (billed yearly)", popular: true, description: monthlyPlans[2].description, features: monthlyPlans[2].features },
  { id: "ultra_annual", name: "Ultra", price: "$5,089", secondary: "$424 / mo (billed yearly)", description: monthlyPlans[3].description, features: monthlyPlans[3].features },
];

export default function PricingPage() {
  const { attachProductCheckout, summary } = useBilling();

  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');

  const displayedPlans = billingCycle === 'month' ? monthlyPlans : annualPlans;

  const currentProductId = (summary?.products?.[0] as { id?: string })?.id ?? "free";

  const handleCheckout = async (productId: string) => {
    try {
      const { checkout_url } = await attachProductCheckout({ productId });
      if (checkout_url) window.location.href = checkout_url;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="max-w-6xl mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-10">Upgrade your plan</h1>

      {/* Billing cycle toggle */}
      <section className="inline-flex mb-8 rounded-lg border overflow-hidden" role="tablist">
        {(['month','year'] as const).map(c => (
          <button
            key={c}
            className={cn('px-4 py-2 text-sm font-medium', billingCycle===c ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted')}
            onClick={() => setBillingCycle(c)}
          >
            {c === 'month' ? 'Monthly' : 'Annual (save 15%)'}
          </button>
        ))}
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list">
        {displayedPlans.map((plan) => {
          const isCurrent = plan.id === currentProductId;
          return (
            <article
              key={plan.id}
              className={cn(
                "rounded-3xl border p-6 flex flex-col items-stretch text-left",
                plan.popular && "border ring-2 ring-secondary/30 shadow",
              )}
            >
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                {plan.name}
                {plan.popular && (
                  <span className="text-xs px-2 py-0.5 bg-secondary/20 text-neutral-700 dark:text-neutral-300 rounded-full">POPULAR</span>
                )}
              </h2>
              <p className="text-4xl font-bold mb-1">{plan.price}</p>
              {plan.secondary && <p className="text-sm text-muted-foreground mb-4">{plan.secondary}</p>}
              <p className="text-sm mb-6 text-muted-foreground min-h-[48px]">{plan.description}</p>

              <ul className="flex-1 mb-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="secondary" className="w-full" disabled>
                  Your current plan
                </Button>
              ) : (
                <Button variant={plan.popular ? "secondary" : "outline"} className="w-full" onClick={() => handleCheckout(plan.id)}>
                  {plan.price === "$0" ? "Get started" : `Get ${plan.name}`}
                </Button>
              )}
            </article>
          );
        })}
      </section>
    </section>
  );
} 