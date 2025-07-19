"use client";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ReactNode } from "react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDiscard: () => void;
  description?: string;
  discardLabel?: string;
  stayLabel?: string;
  trigger?: ReactNode; // optional manual trigger
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  description = "You have unsaved changes. Are you sure you want to leave without completing the action?",
  discardLabel = "Leave page",
  stayLabel = "Stay",
  trigger,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{stayLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onDiscard}>{discardLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 