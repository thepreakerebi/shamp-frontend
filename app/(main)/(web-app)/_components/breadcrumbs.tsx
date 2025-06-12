"use client";
import React, { useEffect, useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProjects } from "@/hooks/use-projects";
import { useProjectsStore } from "@/lib/store/projects";
import { usePersonas } from "@/hooks/use-personas";
import { usePersonasStore } from "@/lib/store/personas";
import { useBatchPersonas } from "@/hooks/use-batch-personas";
import { useBatchPersonasStore } from "@/lib/store/batchPersonas";
import { useTests } from "@/hooks/use-tests";
import { useTestsStore } from "@/lib/store/tests";

export function Breadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const batchQueryId = searchParams.get("batch");
  const segments = pathname.split("/").filter(Boolean);
  let path = "";
  // Find the projectId if present (first segment after 'home')
  const homeIdx = segments.indexOf("home");
  const projectId = homeIdx !== -1 && segments.length > homeIdx + 1 ? segments[homeIdx + 1] : undefined;
  const personasIdx = segments.indexOf("personas");
  const testsIdx = segments.indexOf("tests");
  let personaId: string | undefined = undefined;
  let batchPersonasId: string | undefined = undefined;
  let testId: string | undefined = undefined;
  if (personasIdx !== -1 && segments.length > personasIdx + 1) {
    if (segments[personasIdx + 1] === "batch" && segments.length > personasIdx + 2) {
      batchPersonasId = segments[personasIdx + 2];
    } else if (segments[personasIdx + 1] !== "batch") {
      personaId = segments[personasIdx + 1];
    }
  }
  if (testsIdx !== -1 && segments.length > testsIdx + 1 && segments[testsIdx + 1] !== "batch") {
    testId = segments[testsIdx + 1];
  }
  const { getProjectById } = useProjects();
  const projects = useProjectsStore((s) => s.projects);
  const [projectName, setProjectName] = useState<string | null>(null);
  const { getPersonaById } = usePersonas();
  const personas = usePersonasStore((s) => s.personas);
  const [personaName, setPersonaName] = useState<string | null>(null);
  const { getBatchPersonaById } = useBatchPersonas();
  const [batchPersonaName, setBatchPersonaName] = useState<string | null>(null);
  const batchPersonas = useBatchPersonasStore((s) => s.batchPersonas);
  const [batchQueryName, setBatchQueryName] = useState<string | null>(null);

  // Tests related hooks/state
  const { getTestById } = useTests();
  const tests = useTestsStore((s) => s.tests);
  const [testName, setTestName] = useState<string | null>(null);

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

  useEffect(() => {
    let ignore = false;
    if (batchPersonasId) {
      // Try to get from store first
      const fromStore = batchPersonas?.find((b) => b._id === batchPersonasId);
      if (fromStore) {
        setBatchPersonaName(fromStore.name);
        return;
      }
      // Otherwise, fetch from API
      getBatchPersonaById(batchPersonasId)
        .then((batchPersona) => {
          if (!ignore) setBatchPersonaName(batchPersona?.name || null);
        })
        .catch(() => {
          if (!ignore) setBatchPersonaName(null);
        });
    } else {
      setBatchPersonaName(null);
    }
    return () => { ignore = true; };
  }, [batchPersonasId, getBatchPersonaById, batchPersonas]);

  useEffect(() => {
    if (!batchQueryId) { setBatchQueryName(null); return; }
    const fromStore = batchPersonas?.find((b) => b._id === batchQueryId);
    if (fromStore) { setBatchQueryName(fromStore.name); return; }
    getBatchPersonaById(batchQueryId).then(b=>setBatchQueryName(b?.name||null)).catch(()=>setBatchQueryName(null));
  }, [batchQueryId, batchPersonas, getBatchPersonaById]);

  useEffect(() => {
    let ignore = false;
    if (testId) {
      const testFromStore = tests?.find((t) => t._id === testId);
      if (testFromStore) {
        setTestName(testFromStore.name);
      } else {
        getTestById(testId)
          .then((test) => {
            if (!ignore) setTestName(test?.name || null);
          })
          .catch(() => {
            if (!ignore) setTestName(null);
          });
      }
    } else {
      setTestName(null);
    }
    return () => { ignore = true; };
  }, [testId, getTestById, tests]);

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
          if (segment === batchPersonasId && batchPersonaName) {
            display = batchPersonaName;
          }
          if (segment === "tests") {
            display = "Tests";
          }
          if (segment === testId && testName) {
            display = testName;
          }
          if (segment === "personas" && batchQueryName) {
            return (
              <React.Fragment key={segment + "batch"}>
                {idx > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/personas?tab=groups">Personas</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={`/personas/batch/${batchQueryId}`}>{batchQueryName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={segment}>
              {idx > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{display}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    {segment === "personas" && batchPersonasId ? (
                      <Link href="/personas?tab=groups">{display}</Link>
                    ) : (
                      <Link href={path}>{display}</Link>
                    )}
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