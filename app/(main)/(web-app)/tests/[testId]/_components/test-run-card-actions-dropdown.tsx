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
import React, { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface ActionsFns {
  deleteTestRun: (id: string) => Promise<unknown>;
  moveTestRunToTrash: (id: string) => Promise<unknown>;
}

interface Props {
  runId: string;
  runPersonaName?: string;
  onOpen?: () => void;
  actions: ActionsFns;
  showOpenOptions?: boolean;
  onActionComplete?: () => void;
  editPath?: string;
}

export function TestRunCardActionsDropdown({ runId, runPersonaName, onOpen, actions, showOpenOptions = true, onActionComplete, editPath }: Props) {
  const router = useRouter();
  const { deleteTestRun, moveTestRunToTrash } = actions;

  const [confirmState, setConfirmState] = useState<{
    type: "delete" | "trash" | null;
    loading: boolean;
  }>({ type: null, loading: false });

  const handleOpen = () => {
    if (onOpen) onOpen();
    try { sessionStorage.setItem(`videoViewed:${runId}`, '1'); } catch {}
    router.push(`/testruns/${runId}`);
  };

  const handleOpenNewTab = () => {
    try { sessionStorage.setItem(`videoViewed:${runId}`, '1'); } catch {}
    window.open(`/testruns/${runId}`, "_blank");
  };

  const handleMoveToTrash = () => {
    setConfirmState({ type: "trash", loading: false });
  };

  const handleDelete = () => {
    setConfirmState({ type: "delete", loading: false });
  };

  const handleEdit = () => {
    if (!editPath) return;
    router.push(editPath);
  };

  const confirmAction = async () => {
    if (!confirmState.type) return;
    setConfirmState(s => ({ ...s, loading: true }));
    try {
      if (confirmState.type === "delete") {
        await deleteTestRun(runId);
        toast.success("Test run deleted");
      } else if (confirmState.type === "trash") {
        await moveTestRunToTrash(runId);
        toast.success("Test run moved to trash");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
    setConfirmState({ type: null, loading: false });
    if (onActionComplete) onActionComplete();
  };

  return (
    <>
      <CustomDropdownMenu>
        <CustomDropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()} aria-label="Run options" data-stop-row>
            <EllipsisVerticalIcon className="w-4 h-4" />
          </Button>
        </CustomDropdownMenuTrigger>
        <CustomDropdownMenuContent align="end">
          {showOpenOptions && (
            <>
              <CustomDropdownMenuItem data-stop-row onSelect={handleOpen}>Open</CustomDropdownMenuItem>
              <CustomDropdownMenuItem data-stop-row onSelect={handleOpenNewTab}>Open in new tab</CustomDropdownMenuItem>
            </>
          )}
          {editPath && (
            <CustomDropdownMenuItem data-stop-row onSelect={handleEdit}>Edit schedule</CustomDropdownMenuItem>
          )}
          <CustomDropdownMenuItem data-stop-row onSelect={handleMoveToTrash}>Move to trash</CustomDropdownMenuItem>
          <CustomDropdownMenuItem variant="destructive" data-stop-row onSelect={handleDelete}>Delete</CustomDropdownMenuItem>
        </CustomDropdownMenuContent>
      </CustomDropdownMenu>

      <ConfirmDialog
        open={confirmState.type !== null}
        onOpenChange={o => !o && setConfirmState({ type: null, loading: false })}
        title={confirmState.type === "trash" ? "Move run to trash" : "Delete test run"}
        description={
          confirmState.type === "trash"
            ? `Are you sure you want to move ${runPersonaName ? `${runPersonaName} test run` : "this test run"} to trash?`
            : `Are you sure you want to delete ${runPersonaName ? `${runPersonaName} test run` : "this test run"}?`
        }
        confirmLabel={confirmState.type === "trash" ? "Move to trash" : "Delete"}
        confirmVariant={confirmState.type === "trash" ? "default" : "destructive"}
        loading={confirmState.loading}
        onConfirm={confirmAction}
      />
    </>
  );
} 