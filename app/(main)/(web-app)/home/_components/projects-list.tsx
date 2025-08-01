"use client";
import { useProjects, Project } from "@/hooks/use-projects";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React from "react";
import { ProjectListSkeleton } from "./project-list-skeleton";
import { ProjectCardDropdown } from "./project-card-dropdown";
import { MoveProjectToTrashModal } from "../../_components/move-project-to-trash-modal";
import { useProjectsStore } from "@/lib/store/projects";
import { DeleteProjectModal } from "../../trash/_components/delete-project-modal";
import { toast } from "sonner";
import { ProjectListEmpty } from "./project-list-empty";

// -------------------- ProjectCard component --------------------
interface ProjectCardProps {
  project: Project;
  canEdit: boolean;
  canTrash: boolean;
  showDropdown: boolean;
  onEdit: (project: Project) => void;
  onTrash: (project: Project) => void;
  onDelete: (project: Project) => void;
  showDelete: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = React.memo(
  ({ project, canEdit, canTrash, showDropdown, onEdit, onTrash, onDelete, showDelete }) => {
    const router = useRouter();

    // Fallback logic for image: previewImageUrl -> favicon -> placeholder
    const [imgSrc, setImgSrc] = React.useState(
      project.previewImageUrl
        ? project.previewImageUrl
        : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url ?? "")}&sz=128`
    );
    const [triedFavicon, setTriedFavicon] = React.useState(!project.previewImageUrl);
    const [imageErrored, setImageErrored] = React.useState(false);

    // Refresh image when project URL or preview changes
    React.useEffect(() => {
      const initialSrc = project.previewImageUrl
        ? project.previewImageUrl
        : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url ?? "")}&sz=128`;
      setImgSrc(initialSrc);
      setTriedFavicon(!project.previewImageUrl);
      setImageErrored(false);
    }, [project.previewImageUrl, project.url]);

    const handleImageError = React.useCallback(() => {
      if (imageErrored) return;
      setImageErrored(true);
      if (!triedFavicon && project.url) {
        setImgSrc(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url)}&sz=128`);
        setTriedFavicon(true);
      } else {
        setImgSrc("/placeholder-image.svg");
      }
    }, [imageErrored, triedFavicon, project.url]);

    return (
      <article
        className="rounded-2xl cursor-pointer overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        onClick={() => router.push(`/home/${project._id}`)}
      >
        {/* URL Preview */}
        <div
          className="relative h-32 w-full bg-muted flex items-center justify-center select-none overflow-hidden"
          aria-hidden="true"
        >
          <Image
            src={imgSrc}
            alt={`Preview of ${project.url ?? "no url"}`}
            className="object-cover w-full h-full transition-all duration-200 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
            onError={handleImageError}
          />
        </div>
        
        {/* Card Content */}
        <section className="flex flex-col gap-1 flex-1 justify-end p-4">
          <header className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-md text-foreground leading-tight">{project.name}</h3>
              <p className="text-muted-foreground w-full text-sm truncate">
                {(project.shortUrl || project.url) ? (
                  <span
                    className="underline hover:text-secondary transition-colors cursor-pointer"
                    title={project.url}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      window.open(project.shortUrl || project.url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    {/* Friendlier anchor text for prototypes */}
                    {(project.shortUrl || (project.url?.startsWith("https://www.figma.com/proto/"))) ? "Prototype link" : project.url}
                  </span>
                ) : (
                  "No URL"
                )}
                {` · ${project.testRunsCount ?? 0} test run${(project.testRunsCount ?? 0) === 1 ? "" : "s"}`}
              </p>
            </div>
            {showDropdown && (
              <nav onClick={(e: React.MouseEvent) => e.stopPropagation()} data-stop-row>
                <ProjectCardDropdown
                  onOpen={() => router.push(`/home/${project._id}`)}
                  onEdit={() => onEdit(project)}
                  onTrash={() => onTrash(project)}
                  onDelete={() => onDelete(project)}
                  showEdit={canEdit}
                  showTrash={canTrash}
                  showDelete={showDelete}
                />
              </nav>
            )}
          </header>
        </section>
      </article>
    );
  },
  (prev, next) =>
    prev.project._id === next.project._id &&
    prev.project.name === next.project.name &&
    prev.project.shortUrl === next.project.shortUrl && prev.project.url === next.project.url &&
    prev.project.previewImageUrl === next.project.previewImageUrl &&
    prev.project.testRunsCount === next.project.testRunsCount &&
    prev.canEdit === next.canEdit &&
    prev.canTrash === next.canTrash &&
    prev.showDropdown === next.showDropdown &&
    prev.showDelete === next.showDelete
);

ProjectCard.displayName = "ProjectCard";
// -------------------- End ProjectCard component --------------------

function ProjectsListInner() {
  const { projects, trashedProjects, projectsLoading, projectsError, moveProjectToTrash, deleteProject } = useProjects();
  const { user } = useAuth();
  const router = useRouter();
  const [trashModalOpen, setTrashModalOpen] = React.useState(false);
  const [trashingProject, setTrashingProject] = React.useState<Project | null>(null);
  const [trashLoading, setTrashLoading] = React.useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [projectToDelete, setProjectToDelete] = React.useState<Project | null>(null);

  const uniqueProjects = React.useMemo(() => {
    if (!projects) return [];
    const trashedIds = new Set(trashedProjects?.map(p => p._id) || []);
    return projects.filter(p => !trashedIds.has(p._id));
  }, [projects, trashedProjects]);

  // Function to check if user can trash a project
  const canTrashProject = React.useCallback((project: Project) => {
    // Don't show any permissions until user is fully loaded
    if (!user || !user.currentWorkspaceRole) return false;
    
    // Admin can trash any project in the workspace
    if (user.currentWorkspaceRole === 'admin') return true;
    
    // Members can only trash projects they created
    if (user.currentWorkspaceRole === 'member') {
      return project.createdBy?._id === user._id;
    }
    
    // Default to false if no role or unrecognized role
    return false;
  }, [user?._id, user?.currentWorkspaceRole]);

  // Function to check if user can edit a project (same logic as trash)
  const canEditProject = React.useCallback((project: Project) => {
    // Don't show any permissions until user is fully loaded
    if (!user || !user.currentWorkspaceRole) return false;
    
    // Admin can edit any project in the workspace
    if (user.currentWorkspaceRole === 'admin') return true;
    
    // Members can only edit projects they created
    if (user.currentWorkspaceRole === 'member') {
      return project.createdBy?._id === user._id;
    }
    
    // Default to false if no role or unrecognized role
    return false;
  }, [user?._id, user?.currentWorkspaceRole]);

  // Function to check if dropdown should be shown (user has any actionable options)
  const shouldShowDropdown = React.useCallback((project: Project) => {
    return canEditProject(project) || canTrashProject(project);
  }, [canEditProject, canTrashProject]);

  if (projectsLoading && uniqueProjects.length === 0) return <ProjectListSkeleton count={3} />;
  if (projectsError) return <div className="text-destructive">Error loading projects: {projectsError}</div>;
  if (uniqueProjects.length === 0) return <ProjectListEmpty onCreate={() => router.push('/home/create')} />;

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

  const handleConfirmDelete = async (deleteTests: boolean) => {
    if (!projectToDelete) return;
    setDeleteLoading(true);
    try {
      // Immediate optimistic removal to avoid flicker while waiting for API + socket events
      useProjectsStore.getState().removeProjectFromList(projectToDelete._id);
      await deleteProject(projectToDelete._id, deleteTests);
      toast.success("Project permanently deleted");
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
    <section
        className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 w-full"
      aria-label="Projects list"
    >
      {uniqueProjects.map((project: Project) => (
          <ProjectCard
            key={project._id}
            project={project}
            canEdit={canEditProject(project)}
            canTrash={canTrashProject(project)}
            showDropdown={shouldShowDropdown(project)}
            onEdit={(p) => {
              router.push(`/home/${p._id}/edit`);
            }}
            onTrash={(p) => {
              setTrashingProject(p);
              setTrashModalOpen(true);
            }}
            onDelete={(p) => {
              setProjectToDelete(p);
              setDeleteModalOpen(true);
            }}
            showDelete={canTrashProject(project)}
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

      <DeleteProjectModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        projectName={projectToDelete?.name ?? null}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />

    </>
  );
}

export function ProjectsList() {
  return <ProjectsListInner />;
}