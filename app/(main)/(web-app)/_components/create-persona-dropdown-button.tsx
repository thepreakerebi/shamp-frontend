"use client";
import React from "react";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, Users, Upload, User, ChevronDown } from "lucide-react";
import { useBilling } from "@/hooks/use-billing";

interface CreateDropdownButtonProps {
  onSinglePersona?: () => void;
  onBatchPersonas?: () => void;
  onImportFile?: () => void;
}

export function CreateDropdownButton({ onSinglePersona, onBatchPersonas, onImportFile }: CreateDropdownButtonProps) {
  // Get billing summary to determine plan restrictions
  const { summary, loading: billingLoading } = useBilling();

  // Determine active plan name (defaults to Free)
  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : "Free";

  // Batch personas allowed only for non-Free and non-Hobby plans
  const batchEnabled =
    billingLoading || !["free", "hobby"].includes((planName ?? "").toLowerCase());

  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" /> Create <ChevronDown className="size-4" />
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end">
        <CustomDropdownMenuItem onSelect={onSinglePersona}>
          <User className="size-4 mr-2" /> Single persona
        </CustomDropdownMenuItem>
        {batchEnabled && (
          <CustomDropdownMenuItem onSelect={onBatchPersonas}>
            <Users className="size-4 mr-2" /> Batch personas
          </CustomDropdownMenuItem>
        )}
        <CustomDropdownMenuItem onSelect={onImportFile}>
          <Upload className="size-4 mr-2" /> Import file
        </CustomDropdownMenuItem>
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 