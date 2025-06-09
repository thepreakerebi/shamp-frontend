"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Project } from "@/hooks/use-projects";

interface MoveProjectToTrashModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  project: Project | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function MoveProjectToTrashModal({ open, setOpen, project, onConfirm, loading }: MoveProjectToTrashModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Move Project to Trash</DialogTitle>
          <DialogDescription>
            Are you sure you want to move <span className="font-semibold">{project?.name}</span> to trash? This action can be undone from the trash.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Moving..." : "Move to Trash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 