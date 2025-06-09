"use client";
import React from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useProjects } from "@/hooks/use-projects";
import { useProjectsStore } from "@/lib/store/projects";
import { useEffect, useState } from "react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  let path = "";
  // Find the projectId if present (first segment after 'home')
  const homeIdx = segments.indexOf("home");
  const projectId = homeIdx !== -1 && segments.length > homeIdx + 1 ? segments[homeIdx + 1] : undefined;
  const { getProjectById } = useProjects();
  const projects = useProjectsStore((s) => s.projects);
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (projectId) {
      // Try to get project from store first
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

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/home">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, idx) => {
          path += `/${segment}`;
          const isLast = idx === segments.length - 1;
          if (segment === "home") return null; // skip duplicate Home
          // If this is the projectId segment, show the project name if available
          let display = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (segment === projectId && projectName) {
            display = projectName;
          }
          return (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator />
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