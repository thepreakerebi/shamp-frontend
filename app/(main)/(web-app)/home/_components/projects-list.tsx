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

function ProjectCard({ project, onEdit, onTrash }: { project: Project, onEdit?: () => void, onTrash?: () => void }) {
  // Fallback logic for image: previewImageUrl -> favicon -> placeholder
  const [imgSrc, setImgSrc] = React.useState(
    project.previewImageUrl
      ? project.previewImageUrl
      : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url ?? "")}&sz=128`
  );
  const [triedFavicon, setTriedFavicon] = React.useState(!project.previewImageUrl);
  const router = useRouter();

  const handleOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/home/${project._id}`);
  };
  const handleEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onEdit) onEdit();
  };
  const handleTrash = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onTrash) onTrash();
  };

  return (
    <article
      className="rounded-2xl overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      {/* URL Preview (clickable) */}
      <button
        type="button"
        className="relative h-32 w-full bg-muted flex items-center justify-center cursor-pointer outline-none group/image"
        onClick={handleOpen}
        tabIndex={0}
        aria-label={`Open project ${project.name}`}
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
      </button>
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
          <ProjectCardDropdown
            onOpen={handleOpen}
            onEdit={handleEdit}
            onTrash={handleTrash}
          />
        </footer>
      </section>
    </article>
  );
}

function ProjectsListInner() {
  const { projects, projectsLoading, projectsError, moveProjectToTrash } = useProjects();
  const { setOpen: setCreateOpen } = useCreateProjectModal();
  const [trashModalOpen, setTrashModalOpen] = React.useState(false);
  const [trashingProject, setTrashingProject] = React.useState<Project | null>(null);
  const [trashLoading, setTrashLoading] = React.useState(false);

  if (projectsLoading && (!projects || projects.length === 0)) return <ProjectListSkeleton count={3} />;
  if (projectsError) return <div className="text-destructive">Error loading projects: {projectsError}</div>;
  if (!projects || projects.length === 0) return <ProjectListEmpty onCreate={() => setCreateOpen(true)} />;

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
      {projects.map((project: Project) => (
          <ProjectCard
            key={project._id}
            project={project}
            onEdit={() => {}}
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