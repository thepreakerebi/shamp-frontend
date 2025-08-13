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
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

interface PersonaCardDropdownProps {
  onOpen?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showOpen?: boolean;
  personaId?: string;
  href?: string; // optional navigation target to preserve context (e.g., ?batch=...)
}

export function PersonaCardDropdown({ onOpen, onEdit, onDelete, showOpen = true, personaId, href }: PersonaCardDropdownProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Hide dropdown entirely for non-admins (members)
  if (user?.currentWorkspaceRole !== 'admin') {
    return null;
  }

  const handleOpen = () => {
    if (onOpen) onOpen();
    if (personaId) {
      const to = href || `/personas/${personaId}`;
      router.push(to);
    }
  };

  const handleEdit = () => {
    if (onEdit) onEdit();
    if (personaId) {
      // Editing does not need batch context; go to edit page directly
      router.push(`/personas/${personaId}/edit`);
    }
  };
  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" tabIndex={0} aria-label="Persona options">
          <EllipsisVerticalIcon className="w-4 h-4" />
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end">
        {showOpen && (
          <CustomDropdownMenuItem onSelect={handleOpen}>Open</CustomDropdownMenuItem>
        )}
        <CustomDropdownMenuItem onSelect={handleEdit}>Edit</CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={onDelete} variant="destructive">Delete</CustomDropdownMenuItem>
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 