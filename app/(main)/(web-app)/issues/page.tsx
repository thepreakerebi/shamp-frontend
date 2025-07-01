"use client";

import { useState, useEffect } from "react";
import { useIssues } from "@/hooks/use-issues";
import { IssueCard } from "./_components/issue-card";
import { IssuesListEmpty } from "./_components/issues-list-empty";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function IssuesPage() {
  const { issues: storeIssues } = useIssues();
  const [issues, setIssues] = useState(storeIssues);
  const [loading, setLoading] = useState(storeIssues ? false : true);
  const [initialDone, setInitialDone] = useState(false);

  // Sync state from store
  useEffect(() => {
    setIssues(storeIssues ?? null);
    if (!initialDone) {
      setLoading(false);
      setInitialDone(true);
    }
  }, [storeIssues, initialDone]);

  if ((!initialDone && loading) || (loading && (issues === null || issues.length === 0))) {
    return <section className="p-4 space-y-4">
      <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </section>
    </section>;
  }

  if (initialDone && !loading && (issues === null || issues.length === 0)) {
    return <IssuesListEmpty />;
  }

  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h1 className="text-2xl font-semibold">Issues · {(issues ?? []).length}</h1>
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <Filter className="size-4" /> Filter
        </Button>
      </section>

      <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(issues ?? []).map((issue) => (
          <IssueCard key={issue._id ?? issue.createdAt} issue={issue} />
        ))}
      </section>
    </section>
  );
} 