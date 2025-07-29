import Image from "next/image";
import { useState } from "react";
import { useProjectsStore } from "@/lib/store/projects";
import { useAuth } from "@/lib/auth";
import { ProjectCardDropdown } from "../../_components/project-card-dropdown";
import { MoveProjectToTrashModal } from "../../../_components/move-project-to-trash-modal";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { toast } from "sonner";
import { notFound } from "next/navigation";

interface ProjectDetailsTabContentProps {
  projectId: string;
}

export function ProjectDetailsTabContent({ projectId }: ProjectDetailsTabContentProps) {
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashLoading,setTrashLoading]=useState(false);
  const [redirecting,setRedirecting]=useState(false);
  const [visibleCredentials, setVisibleCredentials] = useState<Record<string, boolean>>({});
  const project = useProjectsStore((s) => s.projects?.find((p) => p._id === projectId) || null);
  const { user } = useAuth();
  const router = useRouter();
  const { moveProjectToTrash } = useProjects();

  // Function to check if user can trash this project
  const canTrashProject = () => {
    if (!user || !project) return false;
    
    // Admin can trash any project in the workspace
    if (user.currentWorkspaceRole === 'admin') return true;
    
    // Members can only trash projects they created
    if (user.currentWorkspaceRole === 'member') {
      return project.createdBy?._id === user._id;
    }
    
    // Default to false if no role or unrecognized role
    return false;
  };

  // Function to check if user can edit this project (same logic as trash)
  const canEditProject = () => {
    if (!user || !project) return false;
    
    // Admin can edit any project in the workspace
    if (user.currentWorkspaceRole === 'admin') return true;
    
    // Members can only edit projects they created
    if (user.currentWorkspaceRole === 'member') {
      return project.createdBy?._id === user._id;
    }
    
    // Default to false if no role or unrecognized role
    return false;
  };

  // Function to check if dropdown should be shown (user has any actionable options)
  const shouldShowDropdown = () => {
    return canEditProject() || canTrashProject();
  };

  const toggleCredentialVisibility = (key: string) => {
    setVisibleCredentials(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (project === null) {
    return null;
  }

  if (!project) {
    if (!redirecting) {
      notFound();
    }
    return null;
  }

  const handleMoveToTrash = async () => {
    if (!project) return;
    try {
      setRedirecting(true); // prevent notFound flash immediately
      setTrashLoading(true);
      await moveProjectToTrash(project._id);
      setTrashOpen(false);
      router.push('/home');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to move to trash');
    } finally {
      setTrashLoading(false);
    }
  };

  return (
    <section className="w-full">
      <MoveProjectToTrashModal open={trashOpen} setOpen={setTrashOpen} project={project} onConfirm={handleMoveToTrash} loading={trashLoading} />
      <section className="flex flex-col gap-6 w-full">
        {/* Section 1: Image + Info + Dropdown */}
        <section className="flex flex-col lsm:flex-row gap-4 items-start">
          {/* Preview Image */}
          <figure className="relative h-32 w-full lsm:w-48 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0">
            <Image
              src={project.previewImageUrl || `/placeholder-image.svg`}
              alt={`Preview of ${project.url ?? "no url"}`}
              className="object-fill w-full h-full"
              fill
              unoptimized
            />
          </figure>
          {/* Info + Dropdown */}
          <section className="flex flex-row w-full gap-4 items-start">
            {/* Name, URL, Test Runs */}
            <section className="flex flex-col flex-1 gap-1 justify-center">
              <header>
                <h2 className="font-medium truncate text-lg text-foreground leading-tight">{project.name}</h2>
              </header>
              <footer className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm truncate">
                  {(project.shortUrl || project.url) ? (
                    <a
                      href={project.shortUrl || project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-secondary transition-colors"
                      title={project.url}
                    >
                      {/* Friendlier anchor text */}
                      {(project.shortUrl || (project.url?.startsWith("https://www.figma.com/proto/"))) ? "Prototype link" : project.url}
                    </a>
                  ) : (
                    "No URL"
                  )}
                  {` · ${project.testRunsCount ?? 0} test run${(project.testRunsCount ?? 0) === 1 ? "" : "s"}`}
                </span>
              </footer>
            </section>
            {/* Dropdown */}
            <section className="flex items-start">
              {shouldShowDropdown() && (
                <ProjectCardDropdown 
                  showOpen={false} 
                  onEdit={() => router.push(`/home/${project._id}/edit`)} 
                  onTrash={() => setTrashOpen(true)}
                  showEdit={canEditProject()}
                  showTrash={canTrashProject()}
                />
              )}
            </section>
          </section>
        </section>

        {/* Section 2: Description */}
        <section className="w-full">
          <header className="mb-1 font-semibold text-base">Description</header>
          <p className="text-muted-foreground w-full">
            {project.description ? project.description : "No description provided for this project."}
          </p>
        </section>

        {/* Section 3: Credentials */}
        <section className="flex flex-col gap-4 w-full min-w-0">
          {/* Auth Credentials */}
          {project.authCredentials && Object.keys(project.authCredentials).length > 0 && (
            <section className="flex-1 min-w-0">
              <header className="mb-1 font-semibold text-base">Auth Credentials</header>
              <div className="flex flex-col">
                {Object.entries(project.authCredentials).map(([key, value]) => {
                  const credentialKey = `auth-${key}`;
                  const isVisible = visibleCredentials[credentialKey];
                  return (
                    <section key={key} className="flex flex-row items-center py-1 min-w-0">
                      <h4 className="flex-[1_1_0%] text-muted-foreground text-sm font-medium truncate min-w-0">{key}</h4>
                      <div className="flex-[2_1_0%] flex items-center gap-2 min-w-0">
                        <span className="text-foreground text-sm break-all min-w-0">
                          {isVisible ? value : '•'.repeat(value.length)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          onClick={() => toggleCredentialVisibility(credentialKey)}
                          aria-label={isVisible ? 'Hide credential' : 'Show credential'}
                        >
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          )}
          {/* Payment Credentials */}
          {project.paymentCredentials && Object.keys(project.paymentCredentials).length > 0 && (
            <section className="flex-1 min-w-0">
              <header className="mb-1 font-semibold text-base">Payment Credentials</header>
              <div className="flex flex-col">
                {Object.entries(project.paymentCredentials).map(([key, value]) => {
                  const credentialKey = `payment-${key}`;
                  const isVisible = visibleCredentials[credentialKey];
                  return (
                    <section key={key} className="flex flex-row items-center py-1 min-w-0">
                      <h4 className="flex-[1_1_0%] text-muted-foreground text-sm font-medium truncate min-w-0">{key}</h4>
                      <div className="flex-[2_1_0%] flex items-center gap-2 min-w-0">
                        <span className="text-foreground text-sm break-all min-w-0">
                          {isVisible ? value : '•'.repeat(value.length)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          onClick={() => toggleCredentialVisibility(credentialKey)}
                          aria-label={isVisible ? 'Hide credential' : 'Show credential'}
                        >
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          )}
        </section>
      </section>
    </section>
  );
} 