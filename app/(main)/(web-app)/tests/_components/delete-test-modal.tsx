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

interface DeleteTestModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  testName: string | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteTestModal({ open, setOpen, testName, onConfirm, loading }: DeleteTestModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl" data-stop-row>
        <DialogHeader>
          <DialogTitle>Delete Test</DialogTitle>
          <DialogDescription>
            This will permanently delete <span className="font-semibold">{testName}</span> and optionally its runs. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 