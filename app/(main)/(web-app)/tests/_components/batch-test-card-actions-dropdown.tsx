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
import { toast } from "sonner";
import React, { useState } from "react";
import { MoveBatchTestToTrashModal } from "./move-batch-test-to-trash-modal";
import { DeleteBatchTestModal } from "./delete-batch-test-modal";

interface ActionFns {
  moveToTrash: (id: string) => Promise<unknown>;
  deleteBatchTest: (id: string, deleteRuns?: boolean) => Promise<unknown>;
}

export function BatchTestCardActionsDropdown({
  batchTestId,
  actions,
  onOpen,
  showOpen = true,
}: {
  batchTestId: string;
  actions: ActionFns;
  onOpen?: () => void;
  showOpen?: boolean;
}) {
  const router = useRouter();
  const { moveToTrash, deleteBatchTest } = actions;

  const [trashOpen, setTrashOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [trashLoading, setTrashLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleOpen = () => {
    if (onOpen) onOpen();
    router.push(`/tests/batch/${batchTestId}`);
  };

  const handleEdit = () => {
    router.push(`/tests/edit-batch?id=${batchTestId}`);
  };

  const handleTrash = () => setTrashOpen(true);
  const handleDelete = () => setDeleteOpen(true);

  const confirmTrash = async () => {
    setTrashLoading(true);
    try {
      await moveToTrash(batchTestId);
      toast.success("Batch test moved to trash");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move batch test to trash");
    } finally {
      setTrashLoading(false);
      setTrashOpen(false);
    }
  };

  const confirmDelete = async (deleteRuns: boolean) => {
    setDeleteLoading(true);
    try {
      await deleteBatchTest(batchTestId, deleteRuns);
      toast.success("Batch test deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete batch test");
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
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
          {showOpen && (
            <CustomDropdownMenuItem data-stop-row onSelect={handleOpen}>Open</CustomDropdownMenuItem>
          )}
          <CustomDropdownMenuItem data-stop-row onSelect={handleEdit}>Edit</CustomDropdownMenuItem>
          <CustomDropdownMenuItem data-stop-row onSelect={handleTrash}>Move to trash</CustomDropdownMenuItem>
          <CustomDropdownMenuItem variant="destructive" data-stop-row onSelect={handleDelete}>Delete</CustomDropdownMenuItem>
        </CustomDropdownMenuContent>
      </CustomDropdownMenu>

      <MoveBatchTestToTrashModal
        open={trashOpen}
        setOpen={setTrashOpen}
        batchTestName={typeof batchTestId === "string" ? "this batch test" : null}
        onConfirm={confirmTrash}
        loading={trashLoading}
      />
      <DeleteBatchTestModal
        open={deleteOpen}
        setOpen={setDeleteOpen}
        batchTestName={typeof batchTestId === "string" ? "this batch test" : null}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </>
  );
} 