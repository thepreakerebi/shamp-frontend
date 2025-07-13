"use client";

import React from "react";
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
import { useRouter } from "next/navigation";
import { StartTestRunModal } from "@/app/(main)/(web-app)/test-runs/_components/start-test-run-modal";

export function CreateSidebarDropdownButton() {
  const router = useRouter();
  const [runModalOpen, setRunModalOpen] = React.useState(false);

  // Billing info to determine feature availability
  const { summary, loading: billingLoading } = useBilling();

  // Determine active plan name (defaults to Free)
  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  // Features permitted only on paid plans (Pro/Ultra etc.)
  const batchFeaturesEnabled =
    billingLoading || !["free", "hobby"].includes((planName ?? "").toLowerCase());

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
          <CustomDropdownMenuItem onSelect={() => router.push('/personas/create')}>
            <User className="size-4 mr-2" /> Single Persona
          </CustomDropdownMenuItem>
          {batchFeaturesEnabled && (
            <CustomDropdownMenuItem onSelect={() => router.push('/personas/batch/create')}>
              <Users className="size-4 mr-2" /> Batch Personas
            </CustomDropdownMenuItem>
          )}

          <CustomDropdownMenuSeparator />

          {/* Tests */}
          <CustomDropdownMenuItem onSelect={() => router.push('/tests/create')}>
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
    </>
  );
} 