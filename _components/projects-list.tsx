"use client";
import { useProjects, Project } from "@/hooks/use-projects";
import { EllipsisVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";

function ProjectCard({ project }: { project: Project }) {
  // Fallback logic for image: previewImageUrl -> favicon -> placeholder
  const [imgSrc, setImgSrc] = React.useState(
    project.previewImageUrl
      ? project.previewImageUrl
      : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(project.url ?? "")}&sz=128`
  );
  const [triedFavicon, setTriedFavicon] = React.useState(!project.previewImageUrl);

  return (
    <article
      className="rounded-2xl overflow-hidden flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
    >
      {/* URL Preview */}
      <figure className="relative h-32 w-full bg-muted flex items-center justify-center">
        <Image
          src={imgSrc}
          alt={`Preview of ${project.url ?? "no url"}`}
          className="object-fill w-full h-full"
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
      </figure>
      {/* Card Content */}
      <section className="flex flex-col gap-1 flex-1 justify-end p-4">
        <header>
          <h2 className="font-medium truncate text-md text-foreground leading-tight">{project.name}</h2>
        </header>
        <footer className="flex items-center gap-2">
          <h3 className="text-muted-foreground w-full text-sm truncate">
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
          </h3>
          <Button variant="ghost" size="icon">
            <EllipsisVerticalIcon className="w-4 h-4" />
          </Button>
        </footer>
      </section>
    </article>
  );
}

export function ProjectsList() {
  const { projects, projectsLoading, projectsError } = useProjects();

  if (projectsLoading && (!projects || projects.length === 0)) return <div>Loading projects...</div>;
  if (projectsError) return <div className="text-destructive">Error loading projects: {projectsError}</div>;
  if (!projects || projects.length === 0) return <div className="text-muted-foreground">No projects found. Create your first project to get started!</div>;

  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full"
      aria-label="Projects list"
    >
      {projects.map((project: Project) => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </section>
  );
} 