"use client";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { EllipsisVerticalIcon } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import React, { useState } from "react";
// import { EditScheduleModal } from "./edit-schedule-modal";
import { useRouter } from "next/navigation";
// Editing is handled on a dedicated page. We simply navigate; the page
// decides whether the id is a run id or a recurring schedule id.

interface ActionFns {
  moveScheduleToTrash: (id: string) => Promise<unknown>;
  deleteSchedule: (id: string) => Promise<unknown>;
}

interface Props {
  scheduleId: string;
  testName?: string;
  currentRule?: string;
  onEdit?: ()=>void;
  actions: ActionFns;
  testId?: string;
}

export function ScheduleRowActionsDropdown({ scheduleId, testName, onEdit, actions, testId }: Props) {
  const { moveScheduleToTrash, deleteSchedule } = actions;
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashLoading, setTrashLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  const handleEdit = () => {
    if (onEdit) { onEdit(); return; }
    if (!testId) return;
    // Navigate to the edit page and let it resolve whether this id is
    // a scheduled run or a recurring schedule
    router.push(`/tests/${testId}/edit-recurring-schedule?scheduleId=${scheduleId}`);
  };

  const confirmTrash = async () => {
    setTrashLoading(true);
    try {
      await moveScheduleToTrash(scheduleId);
    } catch {}
    setTrashLoading(false);
    setTrashOpen(false);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteSchedule(scheduleId);
    } catch {}
    setDeleteLoading(false);
    setDeleteOpen(false);
  };

  return (
    <>
      <CustomDropdownMenu>
        <CustomDropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" onClick={e=>e.stopPropagation()} aria-label="Schedule options" data-stop-row>
            <EllipsisVerticalIcon className="w-4 h-4" />
          </Button>
        </CustomDropdownMenuTrigger>
        <CustomDropdownMenuContent align="end">
          <CustomDropdownMenuItem data-stop-row onSelect={handleEdit}>Edit</CustomDropdownMenuItem>
          <CustomDropdownMenuItem data-stop-row onSelect={()=>setTrashOpen(true)}>Move to trash</CustomDropdownMenuItem>
          <CustomDropdownMenuItem variant="destructive" data-stop-row onSelect={()=>setDeleteOpen(true)}>Delete</CustomDropdownMenuItem>
        </CustomDropdownMenuContent>
      </CustomDropdownMenu>

      {/* Trash dialog */}
      <ConfirmDialog
        open={trashOpen}
        onOpenChange={o=>!o&&setTrashOpen(false)}
        title="Move schedule to trash"
        description={`Are you sure you want to move the schedule for \"${testName ?? 'this test'}\" to trash?`}
        confirmLabel="Move to trash"
        confirmVariant="default"
        loading={trashLoading}
        onConfirm={confirmTrash}
      />

      {/* Delete dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={o=>!o&&setDeleteOpen(false)}
        title="Delete schedule"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />

      {/** Modal intentionally disabled; using edit page instead */}
    </>
  );
} 