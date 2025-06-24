"use client";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVerticalIcon } from "lucide-react";

export interface TrashCardActionsDropdownProps {
  /** Callback executed when user selects "Restore". */
  onRestore: () => void | Promise<void>;
  /** Callback executed when user selects "Delete". */
  onDelete: () => void | Promise<void>;
  /** If true, menu button is disabled. */
  disabled?: boolean;
}

/**
 * Generic dropdown menu to be used for any trashed item card (projects, tests, etc).
 * Shows two actions: Restore (default) and Delete (destructive).
 */
export function TrashCardActionsDropdown({ onRestore, onDelete, disabled }: TrashCardActionsDropdownProps) {
  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="Trash item actions"
          onClick={e => e.stopPropagation()}
          data-stop-row
        >
          <EllipsisVerticalIcon className="size-4" />
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end">
        <CustomDropdownMenuItem onSelect={onRestore} data-stop-row>
          Restore
        </CustomDropdownMenuItem>
        <CustomDropdownMenuItem variant="destructive" onSelect={onDelete} data-stop-row>
          Delete
        </CustomDropdownMenuItem>
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 