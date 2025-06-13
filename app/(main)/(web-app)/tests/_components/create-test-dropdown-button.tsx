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

interface CreateTestDropdownButtonProps {
  onSingleTest?: () => void;
  onBatchTests?: () => void;
}

export function CreateTestDropdownButton({ onSingleTest, onBatchTests }: CreateTestDropdownButtonProps) {
  const router = useRouter();
  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" /> Create <ChevronDown className="size-4" />
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end">
        <CustomDropdownMenuItem onSelect={onSingleTest ?? (()=>router.push("/tests/create"))}>
          <ListChecks className="size-4 mr-2" /> Single test
        </CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={onBatchTests}>
          <ListPlus className="size-4 mr-2" /> Batch tests
        </CustomDropdownMenuItem>
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 