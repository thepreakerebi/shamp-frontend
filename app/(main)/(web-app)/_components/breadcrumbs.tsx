"use client";
import React, { useEffect, useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useProjects } from "@/hooks/use-projects";
import { useProjectsStore } from "@/lib/store/projects";
import { usePersonas } from "@/hooks/use-personas";
import { usePersonasStore } from "@/lib/store/personas";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  let path = "";
  // Find the projectId if present (first segment after 'home')
  const homeIdx = segments.indexOf("home");
  const projectId = homeIdx !== -1 && segments.length > homeIdx + 1 ? segments[homeIdx + 1] : undefined;
  const personasIdx = segments.indexOf("personas");
  let personaId: string | undefined = undefined;
  if (personasIdx !== -1 && segments.length > personasIdx + 1) {
    if (segments[personasIdx + 1] !== "batch") {
      personaId = segments[personasIdx + 1];
    }
  }
  const { getProjectById } = useProjects();
  const projects = useProjectsStore((s) => s.projects);
  const [projectName, setProjectName] = useState<string | null>(null);
  const { getPersonaById } = usePersonas();
  const personas = usePersonasStore((s) => s.personas);
  const [personaName, setPersonaName] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (projectId) {
      const projectFromStore = projects?.find((p) => p._id === projectId);
      if (projectFromStore) {
        setProjectName(projectFromStore.name);
      } else {
        getProjectById(projectId)
          .then((project) => {
            if (!ignore) setProjectName(project?.name || null);
          })
          .catch(() => {
            if (!ignore) setProjectName(null);
          });
      }
    } else {
      setProjectName(null);
    }
    return () => { ignore = true; };
  }, [projectId, getProjectById, projects]);

  useEffect(() => {
    let ignore = false;
    if (personaId) {
      const personaFromStore = personas?.find((p) => p._id === personaId);
      if (personaFromStore) {
        setPersonaName(personaFromStore.name);
      } else {
        getPersonaById(personaId)
          .then((persona) => {
            if (!ignore) setPersonaName(persona?.name || null);
          })
          .catch(() => {
            if (!ignore) setPersonaName(null);
          });
      }
    } else {
      setPersonaName(null);
    }
    return () => { ignore = true; };
  }, [personaId, getPersonaById, personas]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, idx) => {
          // Hide 'batch' segment from breadcrumbs
          if (segment === "batch") return null;
          path += `/${segment}`;
          const isLast = idx === segments.length - 1;
          let display = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (segment === projectId && projectName) {
            display = projectName;
          }
          if (segment === "personas") {
            display = "Personas";
          }
          if (segment === personaId && personaName) {
            display = personaName;
          }
          return (
            <React.Fragment key={segment}>
              {idx > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{display}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={path}>{display}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
} 