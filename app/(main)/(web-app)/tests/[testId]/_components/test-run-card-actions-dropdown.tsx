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

interface ActionsFns {
  deleteTestRun: (id: string) => Promise<unknown>;
}

interface Props {
  runId: string;
  runPersonaName?: string;
  onOpen?: () => void;
  actions: ActionsFns;
}

export function TestRunCardActionsDropdown({ runId, runPersonaName, onOpen, actions }: Props) {
  const router = useRouter();
  const { deleteTestRun } = actions;

  const [confirmState, setConfirmState] = useState<{
    type: "delete" | null;
    loading: boolean;
  }>({ type: null, loading: false });

  const handleOpen = () => {
    if (onOpen) onOpen();
    router.push(`/testruns/${runId}`);
  };

  const handleMoveToTrash = () => {
    // TODO: implement when API available; for now we treat as delete
    setConfirmState({ type: "delete", loading: false });
  };

  const handleDelete = () => {
    setConfirmState({ type: "delete", loading: false });
  };

  const confirmAction = async () => {
    if (!confirmState.type) return;
    setConfirmState(s => ({ ...s, loading: true }));
    if (confirmState.type === "delete") {
      try {
        await deleteTestRun(runId);
      } catch {}
    }
    setConfirmState({ type: null, loading: false });
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
          <CustomDropdownMenuItem data-stop-row onSelect={handleOpen}>Open</CustomDropdownMenuItem>
          <CustomDropdownMenuItem data-stop-row onSelect={handleMoveToTrash}>Move to trash</CustomDropdownMenuItem>
          <CustomDropdownMenuItem variant="destructive" data-stop-row onSelect={handleDelete}>Delete</CustomDropdownMenuItem>
        </CustomDropdownMenuContent>
      </CustomDropdownMenu>

      <ConfirmDialog
        open={confirmState.type === "delete"}
        onOpenChange={o => !o && setConfirmState({ type: null, loading: false })}
        title="Delete test run"
        description={`Are you sure you want to delete ${runPersonaName ?? "this run"}?`}
        confirmLabel="Delete"
        loading={confirmState.loading}
        onConfirm={confirmAction}
      />
    </>
  );
} 