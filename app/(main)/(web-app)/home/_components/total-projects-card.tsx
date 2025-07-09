"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";
import { CountCardSkeleton } from "./count-card-skeleton";
import { useProjects } from "@/hooks/use-projects";

export function TotalProjectsCard() {
  const { count, countLoading, countError } = useProjects();

  // Show skeleton when loading
  if (countLoading) return <CountCardSkeleton />;

  return (
    <Card className="w-full md:max-w-sm bg-card/90 p-0">
      <CardContent className="flex flex-col items-center justify-center p-3 gap-2">
        <section className="flex items-center gap-2 w-full justify-center">
          <FolderKanban className="text-foreground" size={18} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{count}</h1>
        </section>
        <section className="w-full text-center mt-1">
          <h2 className="block text-sm font-medium text-foreground">Projects</h2>
          <h3 className="block text-xs text-muted-foreground">Total in workspace</h3>
        </section>
        {countError && <p className="text-destructive text-xs mt-1">{String(countError)}</p>}
      </CardContent>
    </Card>
  );
} 