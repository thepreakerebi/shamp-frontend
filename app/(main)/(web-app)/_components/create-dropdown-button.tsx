"use client";
import React from "react";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, Users, Upload, User } from "lucide-react";

interface CreateDropdownButtonProps {
  onSinglePersona?: () => void;
  onBatchPersonas?: () => void;
  onImportFile?: () => void;
}

export function CreateDropdownButton({ onSinglePersona, onBatchPersonas, onImportFile }: CreateDropdownButtonProps) {
  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" /> Create
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end">
        <CustomDropdownMenuItem onSelect={onSinglePersona}>
          <User className="size-4 mr-2" /> Single persona
        </CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={onBatchPersonas}>
          <Users className="size-4 mr-2" /> Batch personas
        </CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={onImportFile}>
          <Upload className="size-4 mr-2" /> Import file
        </CustomDropdownMenuItem>
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 