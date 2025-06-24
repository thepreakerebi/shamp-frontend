"use client";
import { useProjects, Project } from "@/hooks/use-projects";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React from "react";
import { ProjectListSkeleton } from "./project-list-skeleton";
import { ProjectCardDropdown } from "./project-card-dropdown";
import { MoveProjectToTrashModal } from "../../_components/move-project-to-trash-modal";
import { toast } from "sonner";
import { ProjectListEmpty } from "./project-list-empty";
import { CreateProjectModalProvider, useCreateProjectModal } from "../../_components/create-project-modal";
import { EditProjectModal } from "../../_components/edit-project-modal";

function ProjectCard({ project, onEdit, onTrash }: { project: Project, onEdit?: () => void, onTrash?: () => void }) {
  // Fallback logic for image: previewImageUrl -> favicon -> placeholder
  const [imgSrc, setImgSrc] = React.useState(
    project.previewImageUrl
      ? project.previewImageUrl
      : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url ?? "")}&sz=128`
  );
  const [triedFavicon, setTriedFavicon] = React.useState(!project.previewImageUrl);
  const router = useRouter();

  // When project URL or preview image changes (e.g., after editing), refresh the image source.
  React.useEffect(() => {
    const initialSrc = project.previewImageUrl
      ? project.previewImageUrl
      : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url ?? "")}&sz=128`;
    setImgSrc(initialSrc);
    setTriedFavicon(!project.previewImageUrl);
  }, [project.previewImageUrl, project.url]);

  const handleOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/home/${project._id}`);
  };
  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onEdit?.();
  };
  const handleTrash = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onTrash) onTrash();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      className="rounded-2xl cursor-pointer overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary"
    >
      {/* URL Preview */}
      <div
        className="relative h-32 w-full bg-muted flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <Image
          src={imgSrc}
          alt={`Preview of ${project.url ?? "no url"}`}
          className="object-fill w-full h-full group-hover/image:brightness-90 transition"
          fill
          unoptimized
          onError={() => {
            if (!triedFavicon && project.url) {
              setImgSrc(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url)}&sz=128`);
              setTriedFavicon(true);
            } else {
              setImgSrc("/placeholder-image.svg");
            }
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
            {project.url ? (
              <span
                className="underline hover:text-secondary transition-colors cursor-pointer"
                title={project.url}
                onClick={e => {
                  e.stopPropagation();
                  window.open(project.url, '_blank', 'noopener,noreferrer');
                }}
              >
                {project.url}
              </span>
            ) : (
              "No URL"
            )}
            {` · ${project.testRunsCount ?? 0} test run${(project.testRunsCount ?? 0) === 1 ? "" : "s"}`}
          </h3>
          <nav onClick={(e)=>e.stopPropagation()} data-stop-row>
            <ProjectCardDropdown
              onOpen={handleOpen}
              onEdit={handleEdit}
              onTrash={handleTrash}
            />
          </nav>
        </footer>
      </section>
    </article>
  );
}

function ProjectsListInner() {
  const { projects, trashedProjects, projectsLoading, projectsError, moveProjectToTrash } = useProjects();
  const { setOpen: setCreateOpen } = useCreateProjectModal();
  const [trashModalOpen, setTrashModalOpen] = React.useState(false);
  const [trashingProject, setTrashingProject] = React.useState<Project | null>(null);
  const [trashLoading, setTrashLoading] = React.useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);

  const uniqueProjects = React.useMemo(() => {
    if (!projects) return [] as Project[];
    const map = new Map<string, Project>();
    const trashedIds = new Set((trashedProjects ?? []).map(t=>t._id));
    projects
      .filter(p => p.trashed !== true && !trashedIds.has(p._id)) // exclude any pending trash
      .forEach(p => {
        if (!map.has(p._id)) map.set(p._id, p);
      });
    return Array.from(map.values());
  }, [projects, trashedProjects]);

  if (projectsLoading && uniqueProjects.length === 0) return <ProjectListSkeleton count={3} />;
  if (projectsError) return <div className="text-destructive">Error loading projects: {projectsError}</div>;
  if (uniqueProjects.length === 0) return <ProjectListEmpty onCreate={() => setCreateOpen(true)} />;

  const handleMoveToTrash = async () => {
    if (!trashingProject) return;
    setTrashLoading(true);
    try {
      await moveProjectToTrash(trashingProject._id);
      setTrashModalOpen(false);
      setTrashingProject(null);
      toast.success("Project moved to trash");
    } catch {
      // Optionally show error toast
    } finally {
      setTrashLoading(false);
    }
  };

  return (
    <>
    <section
        className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 w-full"
      aria-label="Projects list"
    >
      {uniqueProjects.map((project: Project, idx:number) => (
          <ProjectCard
            key={`${project._id}-${idx}`}
            project={project}
            onEdit={() => {
              setEditingProject(project);
              setEditModalOpen(true);
            }}
            onTrash={() => {
              setTrashingProject(project);
              setTrashModalOpen(true);
            }}
          />
      ))}
    </section>
      <MoveProjectToTrashModal
        open={trashModalOpen}
        setOpen={setTrashModalOpen}
        project={trashingProject}
        onConfirm={handleMoveToTrash}
        loading={trashLoading}
      />

      <EditProjectModal
        open={editModalOpen}
        setOpen={setEditModalOpen}
        project={editingProject}
        onSuccess={() => {
          /* Refresh handled inside modal via router.refresh */
        }}
      />
    </>
  );
}

export function ProjectsList() {
  return (
    <CreateProjectModalProvider>
      <ProjectsListInner />
    </CreateProjectModalProvider>
  );
} 