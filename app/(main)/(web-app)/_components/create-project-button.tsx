"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBilling } from "@/hooks/use-billing";
import CheckDialog from "@/components/autumn/check-dialog";

// Rename original component to internal content component
function CreateProjectButtonContent() {
  const router = useRouter();
  const { allowed } = useBilling();
  const [showPaywall, setShowPaywall] = useState(false);

  const { summary } = useBilling();

  const getPreview = () => {
    // detect usage limit scenario
    const features: unknown = summary?.features;
    let feature: unknown;
    if (Array.isArray(features)) {
      feature = features.find((f) => (f as { feature_id: string }).feature_id === "projects");
    } else if (features && typeof features === "object") {
      feature = (features as Record<string, unknown>)["projects"];
    }
    const bal = (feature as { balance?: number })?.balance;
    const usageExhausted = typeof bal === "number" && bal <= 0;

    const nextProduct = {
      id: "pro",
      name: "Pro Plan",
      is_add_on: false,
      free_trial: undefined,
    } as unknown as Record<string, unknown>;

    return {
      scenario: usageExhausted ? "usage_limit" : "feature_flag",
      feature_id: "projects",
      feature_name: "Projects",
      product_id: "pro",
      products: [nextProduct],
    };
  };

  const handleClick = async () => {
    // Optimistic check
    if (allowed({ featureId: "projects" })) {
      router.push("/home/create");
      return;
    }

    // Show pay-wall dialog
    setShowPaywall(true);
  };

  return (
    <>
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full flex items-center gap-2 justify-start"
      onClick={handleClick}
    >
      <Plus className="size-4" />
      <span>Create project</span>
    </Button>
    {showPaywall && (
        /* @ts-expect-error preview partial */
        <CheckDialog open={showPaywall} setOpen={setShowPaywall} preview={getPreview()} />
        )}
    </>
  );
}

// Public component
export function CreateProjectButton() {
  return <CreateProjectButtonContent />;
} 