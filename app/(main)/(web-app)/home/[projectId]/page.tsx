"use client";
import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProjectDetailsTab } from "./_components/project-details-tab";
import { ProjectDetailsTabContent } from "./_components/project-details-tab-content";
import { ProjectTestsTabContent } from "./_components/project-tests-tab-content";
import { ProjectTestrunsTabContent } from "./_components/project-testruns-tab-content";
import { useProjectsStore } from "@/lib/store/projects";
import { useRouter } from "next/navigation";

export default function ProjectDetailsPage() {
  const [tab, setTab] = useState("details");
  const { projectId } = useParams();
  const projects = useProjectsStore((s) => s.projects);
  const trashed = useProjectsStore((s)=> s.trashedProjects);
  const router = useRouter();
  const project = projects?.find((p) => p._id === projectId) || null;


  const isInTrash = !project && trashed && trashed.some(p=>p._id===projectId);

  useEffect(()=>{
    if (isInTrash) {
      router.replace('/home');
    }
  },[isInTrash, router]);

  if (isInTrash) return null;
  if (!project) {
    notFound();
    return null;
  }

  return (
    <main className="p-4">
      {projectId ? (
        <Tabs value={tab} onValueChange={setTab} className="flex-1 w-full">
          <nav className="flex flex-col md:flex-row gap-4 w-full" aria-label="Project details navigation">
            <ProjectDetailsTab />
            <section className="flex-1 min-w-0">
              <TabsContent value="details">
                <ProjectDetailsTabContent projectId={projectId as string} />
              </TabsContent>
              <TabsContent value="tests">
                <ProjectTestsTabContent />
              </TabsContent>
              <TabsContent value="testruns">
                <ProjectTestrunsTabContent />
              </TabsContent>
            </section>
          </nav>
        </Tabs>
      ) : null}
    </main>
  );
} 