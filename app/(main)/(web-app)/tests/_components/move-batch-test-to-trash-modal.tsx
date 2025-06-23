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

interface MoveBatchTestToTrashModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  batchTestName: string | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function MoveBatchTestToTrashModal({ open, setOpen, batchTestName, onConfirm, loading }: MoveBatchTestToTrashModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl" data-stop-row>
        <DialogHeader>
          <DialogTitle>Move Batch Test to Trash</DialogTitle>
          <DialogDescription>
            Are you sure you want to move <span className="font-semibold">{batchTestName}</span> to trash? This action can be undone from the trash.
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