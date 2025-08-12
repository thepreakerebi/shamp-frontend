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

  // Listen for broadcasts from pages
  useEffect(() => {
    const onCreateLoading = (e: Event) => setCreateProjectLoading((e as CustomEvent<boolean>).detail);
    const onEditLoading = (e: Event) => setEditProjectLoading((e as CustomEvent<boolean>).detail);
    const onCreateDirty = (e: Event) => setCreateProjectDirty(Boolean((e as CustomEvent<boolean>).detail));
    const onEditDirty = (e: Event) => setEditProjectDirty(Boolean((e as CustomEvent<boolean>).detail));
    window.addEventListener("create-project-loading", onCreateLoading);
    window.addEventListener("edit-project-loading", onEditLoading);
    window.addEventListener("create-project-dirty", onCreateDirty);
    window.addEventListener("edit-project-dirty", onEditDirty);
    return () => {
      window.removeEventListener("create-project-loading", onCreateLoading);
      window.removeEventListener("edit-project-loading", onEditLoading);
      window.removeEventListener("create-project-dirty", onCreateDirty);
      window.removeEventListener("edit-project-dirty", onEditDirty);
    };
  }, []);

  // Only show on project create/edit pages
  const isCreateProject = pathname === "/home/create";
  const isEditProject = /^\/home\/.+\/edit$/.test(pathname);
  const shouldShow = isCreateProject || isEditProject;
  if (!shouldShow) return null;

  return (
    <section
      className="fixed bottom-0 right-0 z-20 w-full bg-background"
      style={{ left, width }}
    >
      <section className="mx-auto w-full max-w-[500px] px-4">
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
          <section className="flex items-center justify-end gap-2">
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


