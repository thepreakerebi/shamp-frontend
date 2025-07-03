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
import { Checkbox } from "@/components/ui/checkbox";

interface EmptyProjectTrashModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: (deleteTests: boolean) => void;
  loading?: boolean;
}

export function EmptyProjectTrashModal({ open, setOpen, onConfirm, loading }: EmptyProjectTrashModalProps) {
  const [deleteTests, setDeleteTests] = React.useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl" data-stop-row>
        <DialogHeader>
          <DialogTitle>Empty Projects Trash</DialogTitle>
          <DialogDescription>
            This will permanently delete all trashed projects and optionally their tests. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-2">
          <Checkbox id="deleteTests" checked={deleteTests} onCheckedChange={v=>setDeleteTests(!!v)} />
          <label htmlFor="deleteTests" className="text-sm select-none">Also delete all tests, test runs & artifacts for trashed projects</label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={()=>onConfirm(deleteTests)} disabled={loading}>
            {loading ? "Emptying..." : "Empty trash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 