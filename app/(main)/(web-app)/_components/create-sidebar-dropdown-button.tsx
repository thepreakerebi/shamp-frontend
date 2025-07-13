"use client";

import React, { useState } from "react";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
  CustomDropdownMenuSeparator,
} from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Users, FolderPlus, ListChecks, PlayCircle, User, ListPlus } from "lucide-react";
import { useBilling } from "@/hooks/use-billing";
import CheckDialog from "@/components/autumn/check-dialog";
import { useRouter } from "next/navigation";
import { StartTestRunModal } from "@/app/(main)/(web-app)/test-runs/_components/start-test-run-modal";

export function CreateSidebarDropdownButton() {
  const router = useRouter();
  const [runModalOpen, setRunModalOpen] = React.useState(false);
  const [showPaywallTest, setShowPaywallTest] = useState(false);
  const [showPaywallPersona, setShowPaywallPersona] = useState(false);

  // Billing info to determine feature availability
  const { summary, loading: billingLoading, allowed } = useBilling();

  // Determine active plan name (defaults to Free)
  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  // Features permitted only on paid plans (Pro/Ultra etc.)
  const batchFeaturesEnabled =
    billingLoading || !["free", "hobby"].includes((planName ?? "").toLowerCase());

  // Preview builder for paywall
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

  const handleCreateSingleTest = () => {
    if (allowed({ featureId: "tests" })) {
      router.push("/tests/create");
    } else {
      setShowPaywallTest(true);
    }
  };

  const handleCreateSinglePersona = () => {
    if (allowed({ featureId: "personas" })) {
      router.push("/personas/create");
    } else {
      setShowPaywallPersona(true);
    }
  };

  return (
    <>
      <CustomDropdownMenu>
        <CustomDropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="w-full flex items-center gap-2 justify-start"
          >
            <Plus className="size-4" />
            <span>Create</span>
            <ChevronDown className="size-4 ml-auto" />
          </Button>
        </CustomDropdownMenuTrigger>
        <CustomDropdownMenuContent align="start" className="w-56">
          {/* Project */}
          <CustomDropdownMenuItem onSelect={() => router.push('/home/create')}>
            <FolderPlus className="size-4 mr-2" /> Project
          </CustomDropdownMenuItem>

          <CustomDropdownMenuSeparator />

          {/* Personas */}
          <CustomDropdownMenuItem onSelect={handleCreateSinglePersona}>
            <User className="size-4 mr-2" /> Single Persona
          </CustomDropdownMenuItem>
          {batchFeaturesEnabled && (
            <CustomDropdownMenuItem onSelect={() => router.push('/personas/batch/create')}>
              <Users className="size-4 mr-2" /> Batch Personas
            </CustomDropdownMenuItem>
          )}

          <CustomDropdownMenuSeparator />

          {/* Tests */}
          <CustomDropdownMenuItem onSelect={handleCreateSingleTest}>
            <ListChecks className="size-4 mr-2" /> Test
          </CustomDropdownMenuItem>
          {batchFeaturesEnabled && (
            <CustomDropdownMenuItem onSelect={() => router.push('/tests/create-batch')}>
              <ListPlus className="size-4 mr-2" /> Batch Test
            </CustomDropdownMenuItem>
          )}

          <CustomDropdownMenuSeparator />

          {/* Test Run */}
          <CustomDropdownMenuItem onSelect={() => setRunModalOpen(true)}>
            <PlayCircle className="size-4 mr-2" /> Test Run
          </CustomDropdownMenuItem>
        </CustomDropdownMenuContent>
      </CustomDropdownMenu>

      {/* Start Test Run Modal */}
      <StartTestRunModal open={runModalOpen} onOpenChange={setRunModalOpen} />

      {showPaywallTest && (
        /* @ts-expect-error preview partial */
        <CheckDialog open={showPaywallTest} setOpen={setShowPaywallTest} preview={getTestPreview()} />
      )}
      {showPaywallPersona && (
        /* @ts-expect-error preview partial */
        <CheckDialog open={showPaywallPersona} setOpen={setShowPaywallPersona} preview={getPersonaPreview()} />
      )}
    </>
  );
} 