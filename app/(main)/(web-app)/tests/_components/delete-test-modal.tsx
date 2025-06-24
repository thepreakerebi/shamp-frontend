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

interface DeleteTestModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  testName: string | null;
  onConfirm: (deleteRuns: boolean) => void;
  loading?: boolean;
}

export function DeleteTestModal({ open, setOpen, testName, onConfirm, loading }: DeleteTestModalProps) {
  const [deleteRuns, setDeleteRuns] = React.useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl" data-stop-row>
        <DialogHeader>
          <DialogTitle>Delete Test</DialogTitle>
          <DialogDescription>
            This will permanently delete <span className="font-semibold">{testName}</span> and optionally its runs. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 py-2">
          <Checkbox id="deleteRuns" checked={deleteRuns} onCheckedChange={v=>setDeleteRuns(!!v)} />
          <label htmlFor="deleteRuns" className="text-sm select-none">Also delete all test runs & artifacts</label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={()=>onConfirm(deleteRuns)} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 