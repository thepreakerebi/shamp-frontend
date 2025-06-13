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
import React, { useState } from "react";
import { toast } from "sonner";
import { MoveTestToTrashModal } from "./move-test-to-trash-modal";

interface RowActionFns {
  moveTestToTrash: (id: string) => Promise<unknown>;
  deleteTest: (id: string, deleteRuns?: boolean) => Promise<unknown>;
  duplicateTest: (id: string) => Promise<unknown>;
}

interface RowActionsDropdownProps {
  testId: string;
  testName?: string;
  onOpen?: () => void;
  actions: RowActionFns;
}

function RowActionsDropdownComponent({ testId, testName, onOpen, actions }: RowActionsDropdownProps) {
  const router = useRouter();
  const { duplicateTest, moveTestToTrash, deleteTest } = actions;
  const [confirmState, setConfirmState] = useState<{
    type: "trash" | "delete" | "run" | null;
    loading: boolean;
  }>({ type: null, loading: false });

  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashLoading, setTrashLoading] = useState(false);

  const handleRun = () => {
    setConfirmState({ type: "run", loading: false });
  };

  const handleOpen = () => {
    if (onOpen) onOpen();
    router.push(`/tests/${testId}`);
  };

  const handleEdit = () => {
    router.push(`/tests/${testId}/edit`);
  };

  const handleDuplicate = async () => {
    try {
      await duplicateTest(testId);
      toast.success("Test duplicated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate test");
    }
  };

  const handleTrash = () => {
    setTrashModalOpen(true);
  };

  const handleDelete = () => {
    setConfirmState({ type: "delete", loading: false });
  };

  const confirmAction = async () => {
    if (!confirmState.type) return;
    setConfirmState(s => ({ ...s, loading: true }));
    if (confirmState.type === "run") {
      alert("Running test... (API integration pending)");
    } else if (confirmState.type === "trash") {
      await moveTestToTrash(testId);
    } else {
      await deleteTest(testId);
    }
    setConfirmState({ type: null, loading: false });
  };

  const confirmTrash = async () => {
    setTrashLoading(true);
    try {
      await moveTestToTrash(testId);
      toast.success("Test moved to trash");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move test to trash");
    } finally {
      setTrashLoading(false);
      setTrashModalOpen(false);
    }
  };

  return (
    <>
      <CustomDropdownMenu>
        <CustomDropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            aria-label="Test options"
            data-stop-row
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </Button>
        </CustomDropdownMenuTrigger>
        <CustomDropdownMenuContent align="end">
          <CustomDropdownMenuItem data-stop-row onSelect={handleRun}>Run</CustomDropdownMenuItem>
          <CustomDropdownMenuItem data-stop-row onSelect={handleOpen}>Open</CustomDropdownMenuItem>
          <CustomDropdownMenuItem data-stop-row onSelect={handleEdit}>Edit</CustomDropdownMenuItem>
          <CustomDropdownMenuItem data-stop-row onSelect={handleDuplicate}>Duplicate</CustomDropdownMenuItem>
          <CustomDropdownMenuItem data-stop-row onSelect={handleTrash}>Move to trash</CustomDropdownMenuItem>
          <CustomDropdownMenuItem variant="destructive" data-stop-row onSelect={handleDelete}>
            Delete
          </CustomDropdownMenuItem>
        </CustomDropdownMenuContent>
      </CustomDropdownMenu>

      {/* confirmation dialogs */}
      <ConfirmDialog
        open={confirmState.type === "run"}
        onOpenChange={(o) => !o && setConfirmState({ type: null, loading: false })}
        title="Run test"
        description="Are you sure you want to run this test now?"
        confirmLabel="Run test"
        confirmVariant="default"
        loading={confirmState.loading}
        onConfirm={confirmAction}
      />
      <ConfirmDialog
        open={confirmState.type === "delete"}
        onOpenChange={(o) => !o && setConfirmState({ type: null, loading: false })}
        title="Delete test"
        description="This will permanently delete the test. Continue?"
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={confirmState.loading}
        onConfirm={confirmAction}
      />
      {/* Trash modal */}
      <MoveTestToTrashModal
        open={trashModalOpen}
        setOpen={setTrashModalOpen}
        testName={testName ?? "this test"}
        onConfirm={confirmTrash}
        loading={trashLoading}
      />
    </>
  );
}

export const RowActionsDropdown = React.memo(RowActionsDropdownComponent); 