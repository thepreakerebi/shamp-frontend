"use client";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVerticalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import React, { useState } from "react";

interface ActionFns {
  moveToTrash: (id: string) => Promise<unknown>;
  deleteBatchTest: (id: string, deleteRuns?: boolean) => Promise<unknown>;
}

export function BatchTestCardActionsDropdown({
  batchTestId,
  actions,
  onOpen,
}: {
  batchTestId: string;
  actions: ActionFns;
  onOpen?: () => void;
}) {
  const router = useRouter();
  const { moveToTrash, deleteBatchTest } = actions;

  const [confirmOpen, setConfirmOpen] = useState<"trash" | "delete" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    if (onOpen) onOpen();
    router.push(`/batch-tests/${batchTestId}`);
  };

  const handleTrash = () => setConfirmOpen("trash");
  const handleDelete = () => setConfirmOpen("delete");

  const confirmAction = async () => {
    if (!confirmOpen) return;
    setLoading(true);
    try {
      if (confirmOpen === "trash") {
        await moveToTrash(batchTestId);
        toast.success("Batch test moved to trash");
      } else if (confirmOpen === "delete") {
        await deleteBatchTest(batchTestId, false);
        toast.success("Batch test deleted");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
      setConfirmOpen(null);
    }
  };

  return (
    <>
      <CustomDropdownMenu>
        <CustomDropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" onClick={(e)=>e.stopPropagation()} aria-label="Batch test options" data-stop-row>
            <EllipsisVerticalIcon className="w-4 h-4" />
          </Button>
        </CustomDropdownMenuTrigger>
        <CustomDropdownMenuContent align="end">
          <CustomDropdownMenuItem data-stop-row onSelect={handleOpen}>Open</CustomDropdownMenuItem>
          <CustomDropdownMenuItem data-stop-row onSelect={handleTrash}>Move to trash</CustomDropdownMenuItem>
          <CustomDropdownMenuItem variant="destructive" data-stop-row onSelect={handleDelete}>Delete</CustomDropdownMenuItem>
        </CustomDropdownMenuContent>
      </CustomDropdownMenu>

      <ConfirmDialog
        open={confirmOpen !== null}
        onOpenChange={(o)=>!o && setConfirmOpen(null)}
        title={confirmOpen === "trash" ? "Move to trash" : "Delete batch test"}
        description={confirmOpen === "trash" ? "Are you sure you want to move this batch test to trash?" : "This action cannot be undone. Delete batch test permanently?"}
        confirmLabel={confirmOpen === "trash" ? "Move to trash" : "Delete"}
        confirmVariant={confirmOpen === "trash" ? "default" : "destructive"}
        loading={loading}
        onConfirm={confirmAction}
      />
    </>
  );
} 