"use client";
import { useProjects } from "@/hooks/use-projects";
import { Card, CardContent } from "@/components/ui/card";

export function ProjectsList() {
  const { projects, projectsLoading, projectsError } = useProjects();

  if (projectsLoading && (!projects || projects.length === 0)) return <div>Loading projects...</div>;
  if (projectsError) return <div className="text-destructive">Error loading projects</div>;

  return (
    <section
      className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full"
      aria-label="Projects list"
    >
      {(projects ?? []).map((project) => (
        <article
          key={project._id}
          className="bg-card rounded-2xl shadow-md overflow-hidden flex flex-col"
        >
          {/* URL Preview */}
          <figure className="relative h-32 w-full bg-muted flex items-center justify-center">
            <img
              src={`https://image.thum.io/get/width/400/crop/600/${encodeURIComponent(project.url ?? "")}`}
              alt={`Preview of ${project.url ?? "no url"}`}
              className="object-cover w-full h-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-image.svg";
              }}
            />
            <figcaption className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black/40">
              Preview of the web app url
            </figcaption>
          </figure>
          {/* Card Content */}
          <Card className="rounded-none shadow-none border-0 flex-1">
            <CardContent className="p-4 flex flex-col gap-1 flex-1 justify-end">
              <header>
                <h2 className="font-bold text-lg text-foreground leading-tight">{project.name}</h2>
              </header>
              <div className="text-muted-foreground text-sm truncate">{project.url ?? "No URL"}</div>
              <footer className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {(project.testRunsCount ?? 0)} test run{(project.testRunsCount ?? 0) === 1 ? "" : "s"}
                </span>
                <button
                  aria-label="Project actions"
                  className="ml-auto text-xl text-muted-foreground px-2 rounded hover:bg-muted/40 focus:outline-none"
                >
                  &#8230;
                </button>
              </footer>
            </CardContent>
          </Card>
        </article>
      ))}
    </section>
  );
} 