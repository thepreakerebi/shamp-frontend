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
import { Persona } from "@/hooks/use-personas";

interface DeletePersonaModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  persona: Persona | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeletePersonaModal({ open, setOpen, persona, onConfirm, loading }: DeletePersonaModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Delete Persona</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold">{persona?.name}</span>? This action cannot be undone.
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