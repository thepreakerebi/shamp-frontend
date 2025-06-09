import Image from "next/image";
import { useState } from "react";
import { useProjectsStore } from "@/lib/store/projects";
import { ProjectCardDropdown } from "../../_components/project-card-dropdown";
import { EditProjectModal } from "../../../_components/edit-project-modal";
import { MoveProjectToTrashModal } from "../../../_components/move-project-to-trash-modal";

interface ProjectDetailsTabContentProps {
  projectId: string;
}

export function ProjectDetailsTabContent({ projectId }: ProjectDetailsTabContentProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const project = useProjectsStore((s) => s.projects?.find((p) => p._id === projectId) || null);

  if (!project) return null;

  // TODO: Implement actual move to trash logic
  const handleMoveToTrash = () => {
    // Implement move to trash logic here
    setTrashOpen(false);
  };

  return (
    <section className="w-full">
      <EditProjectModal open={editOpen} setOpen={setEditOpen} project={project} />
      <MoveProjectToTrashModal open={trashOpen} setOpen={setTrashOpen} project={project} onConfirm={handleMoveToTrash} />
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
                  {project.url ? (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-secondary transition-colors"
                      title={project.url}
                    >
                      {project.url}
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
              <ProjectCardDropdown showOpen={false} onEdit={() => setEditOpen(true)} onTrash={() => setTrashOpen(true)} />
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
                {Object.entries(project.authCredentials).map(([key, value]) => (
                  <section key={key} className="flex flex-row items-center py-1 min-w-0">
                    <h4 className="flex-[1_1_0%] text-muted-foreground text-sm font-medium truncate min-w-0">{key}</h4>
                    <span className="flex-[2_1_0%] text-foreground text-sm break-all min-w-0">{value}</span>
                  </section>
                ))}
              </div>
            </section>
          )}
          {/* Payment Credentials */}
          {project.paymentCredentials && Object.keys(project.paymentCredentials).length > 0 && (
            <section className="flex-1 min-w-0">
              <header className="mb-1 font-semibold text-base">Payment Credentials</header>
              <div className="flex flex-col">
                {Object.entries(project.paymentCredentials).map(([key, value]) => (
                  <section key={key} className="flex flex-row items-center py-1 min-w-0">
                    <h4 className="flex-[1_1_0%] text-muted-foreground text-sm font-medium truncate min-w-0">{key}</h4>
                    <span className="flex-[2_1_0%] text-foreground text-sm break-all min-w-0">{value}</span>
                  </section>
                ))}
              </div>
            </section>
          )}
        </section>
      </section>
    </section>
  );
} 