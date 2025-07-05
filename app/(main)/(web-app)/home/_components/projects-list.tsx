"use client";
import { useProjects, Project } from "@/hooks/use-projects";
import { useAuth } from "@/lib/auth";
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

function ProjectsListInner() {
  const { projects, trashedProjects, projectsLoading, projectsError, moveProjectToTrash } = useProjects();
  const { user } = useAuth();
  const { setOpen: setCreateOpen } = useCreateProjectModal();
  const [trashModalOpen, setTrashModalOpen] = React.useState(false);
  const [trashingProject, setTrashingProject] = React.useState<Project | null>(null);
  const [trashLoading, setTrashLoading] = React.useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);

  const uniqueProjects = React.useMemo(() => {
    if (!projects) return [];
    const trashedIds = new Set(trashedProjects?.map(p => p._id) || []);
    return projects.filter(p => !trashedIds.has(p._id));
  }, [projects, trashedProjects]);

  // Function to check if user can trash a project
  const canTrashProject = React.useCallback((project: Project) => {
    if (!user) return false;
    
    // Admin can trash any project in the workspace
    if (user.currentWorkspaceRole === 'admin') return true;
    
    // Members can only trash projects they created
    if (user.currentWorkspaceRole === 'member') {
      return project.createdBy?._id === user._id;
    }
    
    // Default to false if no role or unrecognized role
    return false;
  }, [user]);

  // Function to check if user can edit a project (same logic as trash)
  const canEditProject = React.useCallback((project: Project) => {
    if (!user) return false;
    
    // Admin can edit any project in the workspace
    if (user.currentWorkspaceRole === 'admin') return true;
    
    // Members can only edit projects they created
    if (user.currentWorkspaceRole === 'member') {
      return project.createdBy?._id === user._id;
    }
    
    // Default to false if no role or unrecognized role
    return false;
  }, [user]);

  // Function to check if dropdown should be shown (user has any actionable options)
  const shouldShowDropdown = React.useCallback((project: Project) => {
    return canEditProject(project) || canTrashProject(project);
  }, [canEditProject, canTrashProject]);

  const ProjectCard = ({ project, canTrash }: { project: Project; canTrash: boolean }) => {
    const router = useRouter();
    
    // Memoize permission calculations to prevent flickering during re-renders
    const canEdit = React.useMemo(() => canEditProject(project), [project, canEditProject]);
    const showDropdown = React.useMemo(() => shouldShowDropdown(project), [project, shouldShowDropdown]);

    // Fallback logic for image: previewImageUrl -> favicon -> placeholder
    const [imgSrc, setImgSrc] = React.useState(
      project.previewImageUrl
        ? project.previewImageUrl
        : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url ?? "")}&sz=128`
    );
    const [triedFavicon, setTriedFavicon] = React.useState(!project.previewImageUrl);

    // When project URL or preview image changes (e.g., after editing), refresh the image source.
    React.useEffect(() => {
      const initialSrc = project.previewImageUrl
        ? project.previewImageUrl
        : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url ?? "")}&sz=128`;
      setImgSrc(initialSrc);
      setTriedFavicon(!project.previewImageUrl);
    }, [project.previewImageUrl, project.url]);

    const handleOpen = React.useCallback(() => {
      router.push(`/home/${project._id}`);
    }, [router, project._id]);

    const handleEdit = React.useCallback(() => {
      setEditingProject(project);
      setEditModalOpen(true);
    }, [project]);

    const handleTrash = React.useCallback(() => {
      setTrashingProject(project);
      setTrashModalOpen(true);
    }, [project]);

    return (
      <article
        className="rounded-2xl cursor-pointer overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-full group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        onClick={handleOpen}
      >
        {/* URL Preview */}
        <div
          className="relative h-32 w-full bg-muted flex items-center justify-center select-none"
          aria-hidden="true"
        >
          <Image
            src={imgSrc}
            alt={`Preview of ${project.url ?? "no url"}`}
            className="object-fill w-full h-full group-hover:brightness-90 transition"
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
          <header className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-md text-foreground leading-tight">{project.name}</h3>
              <p className="text-muted-foreground w-full text-sm truncate">
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
              </p>
            </div>
            {showDropdown && (
              <nav onClick={(e)=>e.stopPropagation()} data-stop-row>
                <ProjectCardDropdown
                  onOpen={handleOpen}
                  onEdit={handleEdit}
                  onTrash={handleTrash}
                  showEdit={canEdit}
                  showTrash={canTrash}
                />
              </nav>
            )}
          </header>
        </section>
      </article>
    );
  };

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
            canTrash={canTrashProject(project)}
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