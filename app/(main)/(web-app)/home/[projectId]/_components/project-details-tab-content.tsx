import Image from "next/image";
import { Project } from "@/hooks/use-projects";
import { ProjectCardDropdown } from "../../_components/project-card-dropdown";

interface ProjectDetailsTabContentProps {
  project: Project;
}

export function ProjectDetailsTabContent({ project }: ProjectDetailsTabContentProps) {
  return (
    <section className="flex flex-col gap-6">
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
            <ProjectCardDropdown />
          </section>
        </section>
      </section>

      {/* Section 2: Description */}
      <section>
        <header className="mb-1 font-semibold text-base">Description</header>
        <p className="text-muted-foreground">
          {project.description ? project.description : "No description provided for this project."}
        </p>
      </section>

      {/* Section 3: Credentials */}
      <section className="flex flex-col md:flex-row gap-4">
        {/* Auth Credentials */}
        <section className="flex-1">
          <header className="mb-1 font-semibold text-base">Auth Credentials</header>
          {project.authCredentials && Object.keys(project.authCredentials).length > 0 ? (
            <dl className="divide-y divide-border">
              {Object.entries(project.authCredentials).map(([key, value]) => (
                <div key={key} className="flex items-center py-1">
                  <dt className="w-1/3 text-muted-foreground text-sm font-medium truncate">{key}</dt>
                  <dd className="w-2/3 text-foreground text-sm truncate">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground">No auth credentials provided.</p>
          )}
        </section>
        {/* Payment Credentials */}
        <section className="flex-1">
          <header className="mb-1 font-semibold text-base">Payment Credentials</header>
          {project.paymentCredentials && Object.keys(project.paymentCredentials).length > 0 ? (
            <dl className="divide-y divide-border">
              {Object.entries(project.paymentCredentials).map(([key, value]) => (
                <div key={key} className="flex items-center py-1">
                  <dt className="w-1/3 text-muted-foreground text-sm font-medium truncate">{key}</dt>
                  <dd className="w-2/3 text-foreground text-sm truncate">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground">No payment credentials provided.</p>
          )}
        </section>
      </section>
    </section>
  );
} 