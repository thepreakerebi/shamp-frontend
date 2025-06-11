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

interface BatchPersona {
  _id: string;
  name: string;
}

interface DeleteBatchPersonasModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  batchPersona: BatchPersona | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteBatchPersonasModal({ open, setOpen, batchPersona, onConfirm, loading }: DeleteBatchPersonasModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Delete Batch Persona</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold">{batchPersona?.name}</span>? This action cannot be undone.
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