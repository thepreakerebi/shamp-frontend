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

interface ProjectCardDropdownProps {
  onOpen?: () => void;
  onEdit?: () => void;
  onTrash?: () => void;
  onDelete?: () => void;
  showOpen?: boolean;
  showEdit?: boolean;
  showTrash?: boolean;
  showDelete?: boolean;
}

export function ProjectCardDropdown({ onOpen, onEdit, onTrash, onDelete, showOpen = true, showEdit = true, showTrash = true, showDelete = false }: ProjectCardDropdownProps) {
  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" tabIndex={0} aria-label="Project options">
          <EllipsisVerticalIcon className="w-4 h-4" />
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end">
        {showOpen && (
          <CustomDropdownMenuItem onSelect={onOpen}>Open</CustomDropdownMenuItem>
        )}
        {showEdit && (
          <CustomDropdownMenuItem onSelect={onEdit}>Edit</CustomDropdownMenuItem>
        )}
        {showTrash && (
          <CustomDropdownMenuItem onSelect={onTrash}>Move to Trash</CustomDropdownMenuItem>
        )}
        {showDelete && (
          <CustomDropdownMenuItem onSelect={onDelete} variant="destructive">Delete</CustomDropdownMenuItem>
        )}
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 