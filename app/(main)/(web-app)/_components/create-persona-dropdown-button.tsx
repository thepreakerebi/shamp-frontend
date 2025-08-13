"use client";
import React from "react";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, Users, /* Upload, */ User, ChevronDown } from "lucide-react";
import { useBilling } from "@/hooks/use-billing";
import CheckDialog from "@/components/autumn/check-dialog";
import { useState } from "react";

interface CreateDropdownButtonProps {
  onSinglePersona?: () => void;
  onBatchPersonas?: () => void;
  // onImportFile?: () => void; // disabled
}

export function CreateDropdownButton({ onSinglePersona, onBatchPersonas /*, onImportFile*/ }: CreateDropdownButtonProps) {
  const { summary, loading: billingLoading, allowed } = useBilling();
  const [showPaywallPersona, setShowPaywallPersona] = useState(false);

  // Determine active plan name (defaults to Free)
  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  // Batch personas allowed only for non-Free and non-Hobby plans
  const batchEnabled =
    billingLoading || !["free", "hobby"].includes((planName ?? "").toLowerCase());

  // Build preview
  const getPersonaPreview = () => {
    const features: unknown = summary?.features;
    let feature: unknown;
    if (Array.isArray(features)) {
      feature = features.find((f) => (f as { feature_id: string }).feature_id === "personas");
    } else if (features && typeof features === "object") {
      feature = (features as Record<string, unknown>)["personas"];
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
      feature_id: "personas",
      feature_name: "Personas",
      product_id: "hobby",
      products: [nextProduct],
    };
  };

  const handleCreateSinglePersona = () => {
    if (allowed({ featureId: "personas" })) {
      onSinglePersona?.();
    } else {
      setShowPaywallPersona(true);
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
        <CustomDropdownMenuItem onSelect={handleCreateSinglePersona}>
          <User className="size-4 mr-2" /> Single persona
        </CustomDropdownMenuItem>
        {batchEnabled && (
          <CustomDropdownMenuItem onSelect={onBatchPersonas}>
            <Users className="size-4 mr-2" /> Batch personas
          </CustomDropdownMenuItem>
        )}
        {/**
         * Temporarily disabled per request: comment out Import file option.
         *
         * <CustomDropdownMenuItem onSelect={onImportFile}>
         *   <Upload className="size-4 mr-2" /> Import file
         * </CustomDropdownMenuItem>
         */}
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
    {showPaywallPersona && (
      /* @ts-expect-error preview partial */
      <CheckDialog open={showPaywallPersona} setOpen={setShowPaywallPersona} preview={getPersonaPreview()} />
    )}
    </>
  );
} 