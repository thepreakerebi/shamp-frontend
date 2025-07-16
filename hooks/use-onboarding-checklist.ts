import { useProjects } from "@/hooks/use-projects";
import { usePersonas } from "@/hooks/use-personas";
import { useTests } from "@/hooks/use-tests";
import { useTestRuns } from "@/hooks/use-testruns";

export function useOnboardingChecklist() {
  const { projects } = useProjects();
  const { personas } = usePersonas();
  const { tests } = useTests();
  const { testRuns } = useTestRuns();

  const ready = projects !== null && personas !== null && tests !== null && testRuns !== null;

  const hasProject = ready && projects!.length > 0;
  const hasPersona = ready && personas!.length > 0;
  const hasTest = ready && tests!.length > 0;
  const hasRun = ready && testRuns!.length > 0;

  return {
    ready,
    hasProject,
    hasPersona,
    hasTest,
    hasRun,
    allDone: ready && hasProject && hasPersona && hasTest && hasRun,
  };
} 