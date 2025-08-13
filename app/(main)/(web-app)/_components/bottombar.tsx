"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

export const dynamic = "force-dynamic";

export function Bottombar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile } = useSidebar();

  // Positioning to account for sidebar like Topbar does
  const isExpandedDesktop = !isMobile && state === "expanded";
  const left = isExpandedDesktop ? "16rem" : "0";
  const width = isExpandedDesktop ? "calc(100% - 16rem)" : "100%";

  // Local state for dialogs and loading/dirty flags
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [editProjectLoading, setEditProjectLoading] = useState(false);
  const [createProjectDirty, setCreateProjectDirty] = useState(false);
  const [editProjectDirty, setEditProjectDirty] = useState(false);
  const [createPersonaLoading, setCreatePersonaLoading] = useState(false);
  const [editPersonaLoading, setEditPersonaLoading] = useState(false);
  const [createPersonaDirty, setCreatePersonaDirty] = useState(false);
  const [editPersonaDirty, setEditPersonaDirty] = useState(false);
  const [createBatchPersonaLoading, setCreateBatchPersonaLoading] = useState(false);
  const [createBatchPersonaDirty, setCreateBatchPersonaDirty] = useState(false);
  const [createTestLoading, setCreateTestLoading] = useState(false);
  const [editTestLoading, setEditTestLoading] = useState(false);
  const [createTestDirty, setCreateTestDirty] = useState(false);
  const [editTestDirty, setEditTestDirty] = useState(false);
  const [createBatchTestLoading, setCreateBatchTestLoading] = useState(false);
  const [editBatchTestLoading, setEditBatchTestLoading] = useState(false);
  const [createBatchTestDirty, setCreateBatchTestDirty] = useState(false);
  const [editBatchTestDirty, setEditBatchTestDirty] = useState(false);
  const [scheduleRunLoading, setScheduleRunLoading] = useState(false);
  const [editScheduleRunLoading, setEditScheduleRunLoading] = useState(false);
  const [scheduleRunDirty, setScheduleRunDirty] = useState(false);
  const [editScheduleRunDirty, setEditScheduleRunDirty] = useState(false);

  // Listen for broadcasts from pages
  useEffect(() => {
    const onCreateLoading = (e: Event) => setCreateProjectLoading((e as CustomEvent<boolean>).detail);
    const onEditLoading = (e: Event) => setEditProjectLoading((e as CustomEvent<boolean>).detail);
    const onCreateDirty = (e: Event) => setCreateProjectDirty(Boolean((e as CustomEvent<boolean>).detail));
    const onEditDirty = (e: Event) => setEditProjectDirty(Boolean((e as CustomEvent<boolean>).detail));
    const onCreatePersonaLoading = (e: Event) => setCreatePersonaLoading((e as CustomEvent<boolean>).detail);
    const onEditPersonaLoading = (e: Event) => setEditPersonaLoading((e as CustomEvent<boolean>).detail);
    const onCreatePersonaDirty = (e: Event) => setCreatePersonaDirty(Boolean((e as CustomEvent<boolean>).detail));
    const onEditPersonaDirty = (e: Event) => setEditPersonaDirty(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener("create-project-loading", onCreateLoading);
    window.addEventListener("edit-project-loading", onEditLoading);
    window.addEventListener("create-project-dirty", onCreateDirty);
    window.addEventListener("edit-project-dirty", onEditDirty);
    window.addEventListener("create-persona-loading", onCreatePersonaLoading);
    window.addEventListener("edit-persona-loading", onEditPersonaLoading);
    window.addEventListener("create-persona-dirty", onCreatePersonaDirty);
    window.addEventListener("edit-persona-dirty", onEditPersonaDirty);
    window.addEventListener("create-batch-persona-loading", (e: Event) => setCreateBatchPersonaLoading((e as CustomEvent<boolean>).detail));
    window.addEventListener("create-batch-persona-dirty", (e: Event) => setCreateBatchPersonaDirty(Boolean((e as CustomEvent<boolean>).detail)));
    window.addEventListener("create-test-loading", (e: Event) => setCreateTestLoading((e as CustomEvent<boolean>).detail));
    window.addEventListener("edit-test-loading", (e: Event) => setEditTestLoading((e as CustomEvent<boolean>).detail));
    window.addEventListener("create-test-dirty", (e: Event) => setCreateTestDirty(Boolean((e as CustomEvent<boolean>).detail)));
    window.addEventListener("edit-test-dirty", (e: Event) => setEditTestDirty(Boolean((e as CustomEvent<boolean>).detail)));
    window.addEventListener("create-batch-test-loading", (e: Event) => setCreateBatchTestLoading((e as CustomEvent<boolean>).detail));
    window.addEventListener("edit-batch-test-loading", (e: Event) => setEditBatchTestLoading((e as CustomEvent<boolean>).detail));
    window.addEventListener("create-batch-test-dirty", (e: Event) => setCreateBatchTestDirty(Boolean((e as CustomEvent<boolean>).detail)));
    window.addEventListener("edit-batch-test-dirty", (e: Event) => setEditBatchTestDirty(Boolean((e as CustomEvent<boolean>).detail)));
    window.addEventListener("schedule-run-loading", (e: Event) => setScheduleRunLoading((e as CustomEvent<boolean>).detail));
    window.addEventListener("edit-schedule-run-loading", (e: Event) => setEditScheduleRunLoading((e as CustomEvent<boolean>).detail));
    window.addEventListener("schedule-run-dirty", (e: Event) => setScheduleRunDirty(Boolean((e as CustomEvent<boolean>).detail)));
    window.addEventListener("edit-schedule-run-dirty", (e: Event) => setEditScheduleRunDirty(Boolean((e as CustomEvent<boolean>).detail)));
    return () => {
      window.removeEventListener("create-project-loading", onCreateLoading);
      window.removeEventListener("edit-project-loading", onEditLoading);
      window.removeEventListener("create-project-dirty", onCreateDirty);
      window.removeEventListener("edit-project-dirty", onEditDirty);
      window.removeEventListener("create-persona-loading", onCreatePersonaLoading);
      window.removeEventListener("edit-persona-loading", onEditPersonaLoading);
      window.removeEventListener("create-persona-dirty", onCreatePersonaDirty);
      window.removeEventListener("edit-persona-dirty", onEditPersonaDirty);
      window.removeEventListener("create-batch-persona-loading", (e: Event) => setCreateBatchPersonaLoading((e as CustomEvent<boolean>).detail));
      window.removeEventListener("create-batch-persona-dirty", (e: Event) => setCreateBatchPersonaDirty(Boolean((e as CustomEvent<boolean>).detail)));
      window.removeEventListener("create-test-loading", (e: Event) => setCreateTestLoading((e as CustomEvent<boolean>).detail));
      window.removeEventListener("edit-test-loading", (e: Event) => setEditTestLoading((e as CustomEvent<boolean>).detail));
      window.removeEventListener("create-test-dirty", (e: Event) => setCreateTestDirty(Boolean((e as CustomEvent<boolean>).detail)));
      window.removeEventListener("edit-test-dirty", (e: Event) => setEditTestDirty(Boolean((e as CustomEvent<boolean>).detail)));
      window.removeEventListener("create-batch-test-loading", (e: Event) => setCreateBatchTestLoading((e as CustomEvent<boolean>).detail));
      window.removeEventListener("edit-batch-test-loading", (e: Event) => setEditBatchTestLoading((e as CustomEvent<boolean>).detail));
      window.removeEventListener("create-batch-test-dirty", (e: Event) => setCreateBatchTestDirty(Boolean((e as CustomEvent<boolean>).detail)));
      window.removeEventListener("edit-batch-test-dirty", (e: Event) => setEditBatchTestDirty(Boolean((e as CustomEvent<boolean>).detail)));
      window.removeEventListener("schedule-run-loading", (e: Event) => setScheduleRunLoading((e as CustomEvent<boolean>).detail));
      window.removeEventListener("edit-schedule-run-loading", (e: Event) => setEditScheduleRunLoading((e as CustomEvent<boolean>).detail));
      window.removeEventListener("schedule-run-dirty", (e: Event) => setScheduleRunDirty(Boolean((e as CustomEvent<boolean>).detail)));
      window.removeEventListener("edit-schedule-run-dirty", (e: Event) => setEditScheduleRunDirty(Boolean((e as CustomEvent<boolean>).detail)));
    };
  }, []);

  // Only show on create/edit pages
  const isCreateProject = pathname === "/home/create";
  const isEditProject = /^\/home\/.+\/edit$/.test(pathname);
  const isCreatePersona = pathname === "/personas/create";
  const isEditPersona = /^\/personas\/.+\/edit$/.test(pathname);
  const isCreateBatchPersonas = pathname === "/personas/batch/create";
  const isCreateTest = pathname === "/tests/create";
  const isEditTest = /^\/tests\/[^/]+\/edit$/.test(pathname);
  const isCreateBatchTest = pathname === "/tests/create-batch";
  const isEditBatchTest = pathname === "/tests/edit-batch";
  const isScheduleRunCreate = /^\/tests\/[^/]+\/schedule-run$/.test(pathname);
  const isScheduleRunEdit = (
    /^\/tests\/[^/]+\/schedule-run\/[^/]+$/.test(pathname) ||
    pathname === "/tests/edit-recurring-schedule" ||
    /^\/tests\/[^/]+\/edit-recurring-schedule$/.test(pathname)
  );
  const shouldShow = isCreateProject || isEditProject || isCreatePersona || isEditPersona || isCreateBatchPersonas || isCreateTest || isEditTest || isCreateBatchTest || isEditBatchTest || isScheduleRunCreate || isScheduleRunEdit;
  // Forms that intentionally use a narrow max width.
  // Persona create/edit uses a full-width layout with a guide + editor, so exclude them here.
  const isNarrowForm =
    isCreateProject ||
    isEditProject ||
    isCreateBatchPersonas ||
    isCreateBatchTest ||
    isEditBatchTest ||
    isScheduleRunCreate ||
    isScheduleRunEdit;
  const maxWidthClass = isScheduleRunCreate || isScheduleRunEdit ? "max-w-md" : (isNarrowForm ? "max-w-[500px]" : "max-w-none");
  if (!shouldShow) return null;

  return (
    <section
      className="fixed bottom-0 right-0 z-20 w-full bg-background"
      style={{ left, width }}
    >
      <section className={`mx-auto w-full ${maxWidthClass} ${(isCreateProject || isEditProject || isCreateTest || isEditTest || isCreateBatchTest || isEditBatchTest || isScheduleRunCreate || isScheduleRunEdit || isCreatePersona || isEditPersona) ? 'px-4' : ''}`}>
        <section className="flex items-center justify-end gap-2 py-3">
        {isCreateProject && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (createProjectDirty) setConfirmLeaveOpen(true); else router.back();
              }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("create-project-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={createProjectLoading}
              className="flex items-center gap-2"
            >
              {createProjectLoading && <Loader2 className="animate-spin size-4" />}
              {createProjectLoading ? "Creating…" : "Create project"}
            </Button>
          </section>
        )}
        {isEditProject && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (editProjectDirty) setConfirmLeaveOpen(true); else router.back();
              }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("edit-project-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={editProjectLoading}
              className="flex items-center gap-2"
            >
              {editProjectLoading && <Loader2 className="animate-spin size-4" />}
              {editProjectLoading ? "Saving…" : "Save changes"}
            </Button>
          </section>
        )}
        {isCreatePersona && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (createPersonaDirty) setConfirmLeaveOpen(true); else router.back(); }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("create-persona-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={createPersonaLoading}
              className="flex items-center gap-2"
            >
              {createPersonaLoading && <Loader2 className="animate-spin size-4" />}
              {createPersonaLoading ? "Creating…" : "Create persona"}
            </Button>
          </section>
        )}
        {isEditPersona && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (editPersonaDirty) setConfirmLeaveOpen(true); else router.back(); }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("edit-persona-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={editPersonaLoading}
              className="flex items-center gap-2"
            >
              {editPersonaLoading && <Loader2 className="animate-spin size-4" />}
              {editPersonaLoading ? "Saving…" : "Save changes"}
            </Button>
          </section>
        )}
        {isCreateBatchPersonas && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (createBatchPersonaDirty) setConfirmLeaveOpen(true); else router.back(); }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("create-batch-persona-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={createBatchPersonaLoading}
              className="flex items-center gap-2"
            >
              {createBatchPersonaLoading && <Loader2 className="animate-spin size-4" />}
              {createBatchPersonaLoading ? "Creating…" : "Create batch"}
            </Button>
          </section>
        )}
        {isCreateTest && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (createTestDirty) setConfirmLeaveOpen(true); else router.back(); }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("create-test-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={createTestLoading}
              className="flex items-center gap-2"
            >
              {createTestLoading && <Loader2 className="animate-spin size-4" />}
              {createTestLoading ? "Creating…" : "Create test"}
            </Button>
          </section>
        )}
        {isEditTest && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (editTestDirty) setConfirmLeaveOpen(true); else router.back(); }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("edit-test-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={editTestLoading}
              className="flex items-center gap-2"
            >
              {editTestLoading && <Loader2 className="animate-spin size-4" />}
              {editTestLoading ? "Saving…" : "Save changes"}
            </Button>
          </section>
        )}
        {isCreateBatchTest && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (createBatchTestDirty) setConfirmLeaveOpen(true); else router.back(); }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("create-batch-test-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={createBatchTestLoading}
              className="flex items-center gap-2"
            >
              {createBatchTestLoading && <Loader2 className="animate-spin size-4" />}
              {createBatchTestLoading ? "Creating…" : "Create batch test"}
            </Button>
          </section>
        )}
        {isEditBatchTest && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (editBatchTestDirty) setConfirmLeaveOpen(true); else router.back(); }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("edit-batch-test-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={editBatchTestLoading}
              className="flex items-center gap-2"
            >
              {editBatchTestLoading && <Loader2 className="animate-spin size-4" />}
              {editBatchTestLoading ? "Saving…" : "Save changes"}
            </Button>
          </section>
        )}
        {isScheduleRunCreate && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (scheduleRunDirty) setConfirmLeaveOpen(true); else router.back(); }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("schedule-run-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={scheduleRunLoading}
              className="flex items-center gap-2"
            >
              {scheduleRunLoading && <Loader2 className="animate-spin size-4" />}
              {scheduleRunLoading ? "Scheduling…" : "Schedule"}
            </Button>
          </section>
        )}
        {isScheduleRunEdit && (
          <section className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { if (editScheduleRunDirty) setConfirmLeaveOpen(true); else router.back(); }}
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const form = document.getElementById("edit-schedule-run-form") as HTMLFormElement | null;
                form?.requestSubmit();
              }}
              disabled={editScheduleRunLoading}
              className="flex items-center gap-2"
            >
              {editScheduleRunLoading && <Loader2 className="animate-spin size-4" />}
              {editScheduleRunLoading ? "Saving…" : "Save changes"}
            </Button>
          </section>
        )}
        </section>
      </section>
      <UnsavedChangesDialog
        open={confirmLeaveOpen}
        onOpenChange={setConfirmLeaveOpen}
        onDiscard={() => {
          setConfirmLeaveOpen(false);
          router.back();
        }}
      />
    </section>
  );
}


