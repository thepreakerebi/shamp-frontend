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
import { useBilling } from "@/hooks/use-billing";
import CheckDialog from "@/components/autumn/check-dialog";
import { MoveTestToTrashModal } from "./move-test-to-trash-modal";
import { DeleteTestModal } from "./delete-test-modal";

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
  showOpen?: boolean;
  showRun?: boolean;
  showEdit?: boolean;
  showTrash?: boolean;
}

function RowActionsDropdownComponent({ testId, testName, onOpen, actions, showOpen = true, showRun = true, showEdit = true, showTrash = true }: RowActionsDropdownProps) {
  const router = useRouter();
  const { duplicateTest, moveTestToTrash, deleteTest } = actions;
  const [confirmState, setConfirmState] = useState<{
    type: "run" | null;
    loading: boolean;
  }>({ type: null, loading: false });

  const [trashModalOpen, setTrashModalOpen] = useState(false);
  const [trashLoading, setTrashLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { summary, allowed } = useBilling();
  const [showPaywallDuplicate, setShowPaywallDuplicate] = useState(false);

  const getTestPreview = () => {
    const features: unknown = summary?.features;
    let feature: unknown;
    if (Array.isArray(features)) {
      feature = features.find((f) => (f as { feature_id: string }).feature_id === "tests");
    } else if (features && typeof features === "object") {
      feature = (features as Record<string, unknown>)["tests"];
    }
    const bal = (feature as { balance?: number })?.balance;
    const usageExhausted = typeof bal === "number" && bal <= 0;

    const nextProduct = {
      id: "hobby",
      name: "Hobby Plan",
      is_add_on: false,
      free_trial: undefined,
    } as unknown as Record<string, unknown>;

    return {
      scenario: usageExhausted ? "usage_limit" : "feature_flag",
      feature_id: "tests",
      feature_name: "Tests",
      product_id: "hobby",
      products: [nextProduct],
    };
  };

  // Check if dropdown should be shown (user has any actionable options)
  const hasActionableOptions = showEdit || showTrash;
  
  // If user has no actionable options, don't render the dropdown
  if (!hasActionableOptions) {
    return null;
  }

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
    if (!allowed({ featureId: "tests" })) {
      setShowPaywallDuplicate(true);
      return;
    }
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
    setDeleteModalOpen(true);
  };

  const confirmAction = () => {
    if (!confirmState.type) return;
    setConfirmState(s => ({ ...s, loading: true }));
    if (confirmState.type === "run") {
      alert("Running test... (API integration pending)");
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

  const confirmDelete = async (deleteRuns: boolean) => {
    setDeleteLoading(true);
    try {
      await deleteTest(testId, deleteRuns);
      toast.success("Test deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete test");
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
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
          {showRun && <CustomDropdownMenuItem data-stop-row onSelect={handleRun}>Run</CustomDropdownMenuItem>}
          {showOpen && <CustomDropdownMenuItem data-stop-row onSelect={handleOpen}>Open</CustomDropdownMenuItem>}
          {showEdit && <CustomDropdownMenuItem data-stop-row onSelect={handleEdit}>Edit</CustomDropdownMenuItem>}
          <CustomDropdownMenuItem data-stop-row onSelect={handleDuplicate}>Duplicate</CustomDropdownMenuItem>
          {showTrash && <CustomDropdownMenuItem data-stop-row onSelect={handleTrash}>Move to trash</CustomDropdownMenuItem>}
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
      {/* Trash modal */}
      <MoveTestToTrashModal
        open={trashModalOpen}
        setOpen={setTrashModalOpen}
        testName={testName ?? "this test"}
        onConfirm={confirmTrash}
        loading={trashLoading}
      />
      {/* Delete modal */}
      <DeleteTestModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        testName={testName ?? "this test"}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />

      {showPaywallDuplicate && (
        /* @ts-expect-error preview partial */
        <CheckDialog open={showPaywallDuplicate} setOpen={setShowPaywallDuplicate} preview={getTestPreview()} />
      )}
    </>
  );
}

export const RowActionsDropdown = React.memo(RowActionsDropdownComponent); 