"use client";
import React from "react";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";
import { EllipsisVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonaCardDropdownProps {
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showOpen?: boolean;
}

export function PersonaCardDropdown({ onOpen, onEdit, onDelete, showOpen = true }: PersonaCardDropdownProps) {
  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" tabIndex={0} aria-label="Persona options">
          <EllipsisVerticalIcon className="w-4 h-4" />
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end">
        {showOpen && (
          <CustomDropdownMenuItem onSelect={onOpen}>Open</CustomDropdownMenuItem>
        )}
        <CustomDropdownMenuItem onSelect={onEdit}>Edit</CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={onDelete} variant="destructive">Delete</CustomDropdownMenuItem>
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 