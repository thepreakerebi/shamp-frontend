"use client";

import { useState, useEffect, useMemo } from "react";
import { useIssues } from "@/hooks/use-issues";
import { IssueCard } from "./_components/issue-card";
import { IssueCardSkeleton } from "./_components/issue-card-skeleton";
import { IssuesListEmpty } from "./_components/issues-list-empty";
import IssuesFilter from "./_components/issues-filter";

export default function IssuesPage() {
  const { issues: storeIssues } = useIssues();
  const [loading, setLoading] = useState(true);
  // No custom container height needed with grid layout
  const [filters, setFilters] = useState({
    persona: "any",
    status: "any"
  });

  // Get unique persona names for filter options
  const personaOptions = useMemo(() => {
    if (!storeIssues) return [];
    const personas = [...new Set(storeIssues.map(issue => issue.personaName).filter(Boolean))];
    return personas.sort();
  }, [storeIssues]);

  // Filter issues based on selected filters
  const filteredIssues = useMemo(() => {
    if (!storeIssues) return null;
    
    return storeIssues.filter(issue => {
      // Filter by persona
      if (filters.persona !== "any" && issue.personaName !== filters.persona) {
        return false;
      }
      
      // Filter by status
      if (filters.status !== "any") {
        const isResolved = issue.resolved;
        if (filters.status === "resolved" && !isResolved) return false;
        if (filters.status === "unresolved" && isResolved) return false;
      }
      
      return true;
    });
  }, [storeIssues, filters]);

  // Simple logic: stop loading when we get data from the store
  useEffect(() => {
    if (storeIssues !== null) {
      setLoading(false);
    }
  }, [storeIssues]);

  // Removed custom layout useEffects – CSS grid handles layout automatically

  // LOADING STATE: Show skeletons
  if (loading) {
    return (
      <section className="p-4 space-y-4">
        <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
          <h1 className="text-2xl font-semibold">Issues</h1>
        </section>

        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-x-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <IssueCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // NOT LOADING + NO DATA: Show empty state
  if (!filteredIssues || filteredIssues.length === 0) {
    return (
      <section className="p-4 space-y-4">
        <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
          <h1 className="text-2xl font-semibold">Issues · 0</h1>
          <IssuesFilter
            personaOptions={personaOptions}
            filters={filters}
            onChange={setFilters}
          />
        </section>
        <IssuesListEmpty />
      </section>
    );
  }

  // NOT LOADING + HAS DATA: Show actual cards
  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h1 className="text-2xl font-semibold">Issues · {filteredIssues.length}</h1>
        <IssuesFilter
          personaOptions={personaOptions}
          filters={filters}
          onChange={setFilters}
        />
      </section>

      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-x-4">
        {filteredIssues.map((issue) => (
          <div key={issue._id ?? issue.createdAt} className="mb-4 break-inside-avoid">
            <IssueCard issue={issue} />
          </div>
        ))}
      </div>
    </section>
  );
} 