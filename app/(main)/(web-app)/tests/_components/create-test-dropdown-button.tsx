"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, ListChecks, ListPlus, ChevronDown } from "lucide-react";
import { useBilling } from "@/hooks/use-billing";
import CheckDialog from "@/components/autumn/check-dialog";
import { useState } from "react";

interface CreateTestDropdownButtonProps {
  onSingleTest?: () => void;
  onBatchTests?: () => void;
}

export function CreateTestDropdownButton({ onSingleTest, onBatchTests }: CreateTestDropdownButtonProps) {
  const router = useRouter();

  const { summary, loading: billingLoading, allowed } = useBilling();
  const [showPaywallTest, setShowPaywallTest] = useState(false);

  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  const batchEnabled =
    billingLoading || !["free", "hobby"].includes((planName ?? "").toLowerCase());

  // Build paywall preview similar to project button
  const getTestPreview = () => {
    const features: unknown = summary?.features;
    let feature: unknown;
    if (Array.isArray(features)) {
      feature = features.find((f) => (f as { feature_id: string }).feature_id === "tests");
    } else if (features && typeof features === "object") {
      feature = (features as Record<string, unknown>)["tests"];
    }
    const bal = (feature as { balance?: number })?.balance;
    const usageExhausted = typeof bal === "number" && bal <= 0;

    const nextProduct = {
      id: "hobby",
      name: "Hobby Plan",
      is_add_on: false,
      free_trial: undefined,
    } as unknown as Record<string, unknown>;

    return {
      scenario: usageExhausted ? "usage_limit" : "feature_flag",
      feature_id: "tests",
      feature_name: "Tests",
      product_id: "hobby",
      products: [nextProduct],
    };
  };

  const handleCreateSingleTest = () => {
    if (allowed({ featureId: "tests" })) {
      (onSingleTest ?? (() => router.push("/tests/create")))();
    } else {
      setShowPaywallTest(true);
    }
  };

  return (
    <>
      <CustomDropdownMenu>
        <CustomDropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Plus className="size-4" /> Create <ChevronDown className="size-4" />
          </Button>
        </CustomDropdownMenuTrigger>
        <CustomDropdownMenuContent align="end">
          <CustomDropdownMenuItem onSelect={handleCreateSingleTest}>
            <ListChecks className="size-4 mr-2" /> Single test
          </CustomDropdownMenuItem>
          {batchEnabled && (
            <CustomDropdownMenuItem onSelect={onBatchTests ?? (() => router.push("/tests/create-batch"))}>
              <ListPlus className="size-4 mr-2" /> Batch tests
            </CustomDropdownMenuItem>
          )}
        </CustomDropdownMenuContent>
      </CustomDropdownMenu>

      {showPaywallTest && (
        /* @ts-expect-error preview partial */
        <CheckDialog open={showPaywallTest} setOpen={setShowPaywallTest} preview={getTestPreview()} />
      )}
    </>
  );
} 