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

interface RowActionFns {
  moveTestToTrash: (id: string) => Promise<unknown>;
  deleteTest: (id: string, deleteRuns?: boolean) => Promise<unknown>;
  duplicateTest: (id: string) => Promise<unknown>;
}

interface RowActionsDropdownProps {
  testId: string;
  onOpen?: () => void;
  actions: RowActionFns;
}

function RowActionsDropdownComponent({ testId, onOpen, actions }: RowActionsDropdownProps) {
  const router = useRouter();
  const { duplicateTest, moveTestToTrash, deleteTest } = actions;
  const [confirmState, setConfirmState] = useState<{
    type: "trash" | "delete" | null;
    loading: boolean;
  }>({ type: null, loading: false });

  const handleRun = () => {
    // TODO: implement run logic
  };

  const handleOpen = () => {
    if (onOpen) onOpen();
    router.push(`/tests/${testId}`);
  };

  const handleEdit = () => {
    // TODO: implement edit logic (open modal or navigate to edit page)
  };

  const handleDuplicate = async () => {
    await duplicateTest(testId);
  };

  const handleTrash = () => {
    setConfirmState({ type: "trash", loading: false });
  };

  const handleDelete = () => {
    setConfirmState({ type: "delete", loading: false });
  };

  const confirmAction = async () => {
    if (!confirmState.type) return;
    setConfirmState(s => ({ ...s, loading: true }));
    if (confirmState.type === "trash") {
      await moveTestToTrash(testId);
    } else {
      await deleteTest(testId);
    }
    setConfirmState({ type: null, loading: false });
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
          <CustomDropdownMenuItem onSelect={handleRun}>Run</CustomDropdownMenuItem>
          <CustomDropdownMenuItem onSelect={handleOpen}>Open</CustomDropdownMenuItem>
          <CustomDropdownMenuItem onSelect={handleEdit}>Edit</CustomDropdownMenuItem>
          <CustomDropdownMenuItem onSelect={handleDuplicate}>Duplicate</CustomDropdownMenuItem>
          <CustomDropdownMenuItem onSelect={handleTrash}>Move to trash</CustomDropdownMenuItem>
          <CustomDropdownMenuItem variant="destructive" onSelect={handleDelete}>
            Delete
          </CustomDropdownMenuItem>
        </CustomDropdownMenuContent>
      </CustomDropdownMenu>

      {/* confirmation dialogs */}
      <ConfirmDialog
        open={confirmState.type === "trash"}
        onOpenChange={(o) => !o && setConfirmState({ type: null, loading: false })}
        title="Move test to trash"
        description="Are you sure you want to move this test to trash?"
        confirmLabel="Move to trash"
        confirmVariant="destructive"
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
    </>
  );
}

export const RowActionsDropdown = React.memo(RowActionsDropdownComponent); 