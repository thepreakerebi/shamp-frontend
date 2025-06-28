"use client";
import React, { useEffect, useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useProjects } from "@/hooks/use-projects";
import { useProjectsStore } from "@/lib/store/projects";
import { usePersonas } from "@/hooks/use-personas";
import { usePersonasStore } from "@/lib/store/personas";
import { useBatchPersonas } from "@/hooks/use-batch-personas";
import { useBatchPersonasStore } from "@/lib/store/batchPersonas";
import { useTests } from "@/hooks/use-tests";
import { useTestsStore } from "@/lib/store/tests";
import { useBatchTests } from "@/hooks/use-batch-tests";
import { useBatchTestsStore } from "@/lib/store/batchTests";

// Force dynamic rendering to prevent static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export function Breadcrumbs() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [batchQueryId, setBatchQueryId] = useState<string | null>(null);
  const [projectIdQuery, setProjectIdQuery] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Get search params from URL once component mounts on client
    const urlParams = new URLSearchParams(window.location.search);
    setBatchQueryId(urlParams.get("batch"));
    setProjectIdQuery(urlParams.get("project"));
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  let path = "";
  // Find the projectId if present (first segment after 'home')
  const homeIdx = segments.indexOf("home");
  let projectId = homeIdx !== -1 && segments.length > homeIdx + 1 ? segments[homeIdx + 1] : undefined;
  if (!projectId && projectIdQuery) {
    projectId = projectIdQuery;
  }
  const personasIdx = segments.indexOf("personas");
  const testsIdx = segments.indexOf("tests");
  const scheduleRunIdx = segments.indexOf("schedule-run");
  let pathIdEdit: string | undefined = undefined;
  if (scheduleRunIdx !== -1 && segments.length > scheduleRunIdx + 1) {
    pathIdEdit = segments[scheduleRunIdx + 1];
  }
  let personaId: string | undefined = undefined;
  let batchPersonasId: string | undefined = undefined;
  let testId: string | undefined = undefined;
  let batchTestId: string | undefined = undefined;
  if (personasIdx !== -1 && segments.length > personasIdx + 1) {
    if (segments[personasIdx + 1] === "batch" && segments.length > personasIdx + 2) {
      batchPersonasId = segments[personasIdx + 2];
    } else if (segments[personasIdx + 1] !== "batch") {
      personaId = segments[personasIdx + 1];
    }
  }
  if (testsIdx !== -1 && segments.length > testsIdx + 1) {
    if (segments[testsIdx + 1] === "batch" && segments.length > testsIdx + 2) {
      batchTestId = segments[testsIdx + 2];
    } else {
    testId = segments[testsIdx + 1];
    }
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

  // Batch tests name
  const { getBatchTestById } = useBatchTests();
  const batchTests = useBatchTestsStore((s)=>s.batchTests);
  const [batchTestName, setBatchTestName] = useState<string | null>(null);

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
  }, [projectId, projects]);

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
  }, [personaId, personas]);

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
  }, [batchPersonasId, batchPersonas]);

  useEffect(() => {
    if (!batchQueryId) { setBatchQueryName(null); return; }
    const fromStore = batchPersonas?.find((b) => b._id === batchQueryId);
    if (fromStore) { setBatchQueryName(fromStore.name); return; }
    getBatchPersonaById(batchQueryId).then(b=>setBatchQueryName(b?.name||null)).catch(()=>setBatchQueryName(null));
  }, [batchQueryId, batchPersonas]);

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
  }, [testId, tests]);

  useEffect(()=>{
    let ignore=false;
    if(batchTestId){
      const fromStore = batchTests?.find(b=>b._id===batchTestId);
      if(fromStore){ setBatchTestName(()=> typeof fromStore.test==='object'&&fromStore.test && 'name' in fromStore.test ? (fromStore.test as {name?:string}).name || null : null); }
      else{
        getBatchTestById(batchTestId).then(bt=>{
          if(ignore) return;
          const nm = typeof bt.test==='object' && bt.test && 'name' in bt.test ? (bt.test as {name?:string}).name || null : null;
          setBatchTestName(nm);
        }).catch(()=>{ if(!ignore) setBatchTestName(null); });
      }
    }else{ setBatchTestName(null); }
    return ()=>{ignore=true;};
  },[batchTestId, batchTests]);

  // Prevent rendering until client-side mount to avoid hydration issues
  if (!mounted) {
    return null;
  }

  // Special-cased breadcrumb for tests detail with project context via query param
  const isTestDetailWithProject = segments[0] === "tests" && !!projectIdQuery;

  if (isTestDetailWithProject) {
    // Build manually: Home > Project > Test
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/home">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {projectName ? (
              <BreadcrumbLink asChild>
                <Link href={`/home/${projectIdQuery}`}>{projectName}</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>Project</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{testName ?? "Test"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

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
          if (segment === "schedule-run") {
            // Show different label depending on whether we are editing an existing run (has an id) or creating a new one
            display = pathIdEdit ? "Edit scheduled run" : "Schedule run";
          }
          if (segment === pathIdEdit && pathIdEdit) {
            return null;
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
          if (segment === batchTestId && batchTestName) {
            display = batchTestName;
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