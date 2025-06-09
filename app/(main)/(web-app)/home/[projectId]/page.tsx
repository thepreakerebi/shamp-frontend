"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProjectDetailsTab } from "./_components/project-details-tab";
import { ProjectDetailsTabContent } from "./_components/project-details-tab-content";
import { ProjectTestsTabContent } from "./_components/project-tests-tab-content";
import { ProjectTestrunsTabContent } from "./_components/project-testruns-tab-content";
import { useProjects, Project } from "@/hooks/use-projects";

export default function ProjectDetailsPage() {
  const [tab, setTab] = useState("details");
  const { projectId } = useParams();
  const { getProjectById } = useProjects();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!projectId) return;
    getProjectById(projectId as string).then(setProject);
  }, [projectId, getProjectById]);

  return (
    <main className="p-4">
      {project ? (
        <Tabs value={tab} onValueChange={setTab} className="flex-1 w-full">
          <nav className="flex flex-col md:flex-row gap-4 w-full" aria-label="Project details navigation">
            <ProjectDetailsTab />
            <section className="flex-1 min-w-0">
              <TabsContent value="details">
                <ProjectDetailsTabContent project={project} />
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