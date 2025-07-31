"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTests } from "@/hooks/use-tests";
import { TestCard } from "@/app/(main)/(web-app)/tests/_components/test-card";
import { TestsCardSkeleton } from "@/app/(main)/(web-app)/tests/_components/tests-card-skeleton";
import { TestsCardToolbar } from "@/app/(main)/(web-app)/tests/_components/tests-card-toolbar";
import { TestsListEmpty } from "@/app/(main)/(web-app)/tests/_components/tests-list-empty";

export function ProjectTestsTabContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const { tests, testsLoading } = useTests();

  // Scroll-to-top button (mobile parity with TestsList)
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Filter tests for this project
  const filtered = (tests || []).filter(t => {
    const proj = t.project;
    const id = typeof proj === "string" ? proj : (proj as { _id: string })._id;
    return id === projectId;
  });

  if (testsLoading && filtered.length === 0) {
    return <TestsCardSkeleton count={6} />;
  }

  if (!testsLoading && filtered.length === 0) {
    // Re-use existing empty state component
    return <TestsListEmpty />;
  }

  return (
    <section>
      <section className="flex flex-col">
        <TestsCardToolbar projectId={projectId as string} />
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 py-1">
          {filtered.map(test => (
            <TestCard key={test._id} test={test} projectId={projectId as string} />
          ))}
        </section>
      </section>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-4 z-20 md:hidden bg-secondary text-secondary-foreground rounded-full p-3 shadow-lg"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </section>
  );
} 