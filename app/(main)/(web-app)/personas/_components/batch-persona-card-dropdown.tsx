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

interface BatchPersonaCardDropdownProps {
  onOpen?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  batchPersonaId?: string;
}

export function BatchPersonaCardDropdown({ onOpen, onDelete, onRename, batchPersonaId }: BatchPersonaCardDropdownProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Hide dropdown for non-admins (members)
  if (user?.currentWorkspaceRole !== 'admin') {
    return null;
  }

  const handleOpen = () => {
    if (onOpen) onOpen();
    if (batchPersonaId) {
      router.push(`/personas/batch/${batchPersonaId}`);
    }
  };
  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" tabIndex={0} aria-label="Batch persona options">
          <EllipsisVerticalIcon className="w-4 h-4" />
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end">
        <CustomDropdownMenuItem onSelect={handleOpen}>Open</CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={() => { if (onRename) onRename(); }}>Change name</CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={() => { if (onDelete) onDelete(); }} variant="destructive">Delete</CustomDropdownMenuItem>
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 