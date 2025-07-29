"use client";
import { useProjects, type Project } from "@/hooks/use-projects";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import React, { useState } from "react";
import { TrashCardActionsDropdown } from "@/components/ui/trash-card-actions-dropdown";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProjectListSkeleton } from "../../home/_components/project-list-skeleton";
import { DeleteProjectModal } from "./delete-project-modal";
import { EmptyProjectTrashModal } from "./empty-project-trash-modal";

export function TrashedProjectsList() {
  const {
    trashedProjects,
    trashedProjectsLoading,
    trashedProjectsError,
    restoreProjectFromTrash,
    deleteProject,
    refetchTrashed,
    emptyProjectTrash,
  } = useProjects();
  const { user } = useAuth();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [emptyTrashLoading, setEmptyTrashLoading] = useState(false);

  const handleRestore = async (project: Project) => {
    try {
      await restoreProjectFromTrash(project._id);
      toast.success("Project restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore project");
    }
  };

  const handleDeletePrompt = (project: Project) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (deleteTests: boolean) => {
    if (!projectToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteProject(projectToDelete._id, deleteTests);
      toast.success("Project permanently deleted");
      setDeleteModalOpen(false);
      setProjectToDelete(null);
      // refresh list
      refetchTrashed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEmptyTrash = async (deleteTests: boolean) => {
    setEmptyTrashLoading(true);
    try {
      await emptyProjectTrash(deleteTests);
      toast.success("Projects trash emptied");
      setEmptyTrashOpen(false);
      refetchTrashed();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to empty projects trash");
    } finally {
      setEmptyTrashLoading(false);
    }
  };

  // Ensure unique keys by deduplicating any accidental duplicates from the store
  const uniqueProjects = React.useMemo(() => {
    if (!trashedProjects) return [] as Project[];
    const map = new Map<string, Project>();
    trashedProjects
      .filter(p => p.trashed === true) // only items still trashed
      .forEach(p => {
        if (!map.has(p._id)) map.set(p._id, p);
      });
    const arr = Array.from(map.values());
    const getTs = (p: Project): number => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyP = p as any;
      if (anyP.updatedAt) return new Date(anyP.updatedAt).getTime();
      if (p._id && typeof p._id === 'string' && p._id.length >= 8) {
        return parseInt(p._id.substring(0,8),16)*1000;
      }
      return Date.now(); // fallback to current time
    };
    return arr.sort((a,b)=> getTs(b) - getTs(a));
  }, [trashedProjects]);

  // Check if user can empty trash
  const canEmptyTrash = React.useMemo(() => {
    if (!user) return false;
    
    // Admin can empty all trash
    if (user.currentWorkspaceRole === 'admin') return true;
    
    // Members can only empty trash if they have trashed projects they created
    if (user.currentWorkspaceRole === 'member') {
      return uniqueProjects.some(project => project.createdBy?._id === user._id);
    }
    
    return false;
  }, [user, uniqueProjects]);

  if (trashedProjectsLoading && (!trashedProjects || trashedProjects.length === 0)) {
    return <ProjectListSkeleton count={3} />;
  }

  if (trashedProjectsError) {
    return <p className="text-destructive p-4">Error loading trashed projects: {trashedProjectsError}</p>;
  }

  return (
    <section>
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2 px-4">
        <h2 className="text-xl font-semibold">Trashed Projects · {uniqueProjects.length}</h2>
        {uniqueProjects.length > 0 && canEmptyTrash && (
          <Button 
            variant="outline" 
            onClick={() => setEmptyTrashOpen(true)}
            disabled={emptyTrashLoading}
          >
            Empty projects trash
          </Button>
        )}
      </section>

      {uniqueProjects.length === 0 ? (
        <p className="text-muted-foreground p-4">No projects in trash.</p>
      ) : (
      <section className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 p-4" aria-label="Trashed projects list">
        {uniqueProjects.map((project, idx) => (
          <article
            key={`${project._id}-${idx}`}
            className="rounded-2xl overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full group"
          >
            {/* URL Preview */}
            <div className="relative h-32 w-full bg-muted flex items-center justify-center select-none" aria-hidden="true">
              <Image
                src={project.previewImageUrl ?? `/placeholder-image.svg`}
                alt={`Preview of ${project.url ?? "no url"}`}
                className="object-fill w-full h-full group-hover/image:brightness-90 transition"
                fill
                unoptimized
                onError={e => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = "/placeholder-image.svg";
                }}
              />
            </div>
            {/* Card Content */}
            <section className="flex flex-col gap-1 flex-1 justify-end p-4">
              <header>
                <h2 className="font-medium truncate text-md text-foreground leading-tight">{project.name}</h2>
              </header>
              <footer className="flex items-center gap-2">
                <h3 className="text-muted-foreground w-full text-sm truncate">
                  {project.shortUrl || project.url || "No URL"}
                </h3>
                {(user?.currentWorkspaceRole === 'admin' || project.createdBy?._id === user?._id) && (
                  <TrashCardActionsDropdown
                    onRestore={() => handleRestore(project)}
                    onDelete={() => handleDeletePrompt(project)}
                  />
                )}
              </footer>
            </section>
          </article>
        ))}
      </section>
      )}

      {/* Confirm permanent delete */}
      <DeleteProjectModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        projectName={projectToDelete?.name ?? null}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

      {/* Empty trash confirmation */}
      <EmptyProjectTrashModal
        open={emptyTrashOpen}
        setOpen={setEmptyTrashOpen}
        onConfirm={handleEmptyTrash}
        loading={emptyTrashLoading}
      />
    </section>
  );
}