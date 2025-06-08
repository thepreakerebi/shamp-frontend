"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";
import { CountCardSkeleton } from "./count-card-skeleton";
import useSWR from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

const fetcher = (url: string) => fetch(`${API_BASE}${url}`).then(res => res.json());

export function TotalProjectsCard() {
  const { data, error, isLoading } = useSWR<{ count: number }>(
    '/api/projects/count',
    fetcher,
    { refreshInterval: 5000 }
  );

  // Show skeleton only on first load
  if (isLoading && !data) return <CountCardSkeleton />;

  return (
    <Card className="w-full md:max-w-sm bg-card/90 p-0">
      <CardContent className="flex flex-col items-center justify-center p-3 gap-2">
        <section className="flex items-center gap-2 w-full justify-center">
          <FolderKanban className="text-foreground" size={18} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{data?.count ?? 0}</h1>
        </section>
        <section className="w-full text-center mt-1">
          <h2 className="block text-sm font-medium text-foreground">Projects</h2>
          <h3 className="block text-xs text-muted-foreground">Total in workspace</h3>
        </section>
        {error && <p className="text-destructive text-xs mt-1">{error.message || 'Error loading projects'}</p>}
      </CardContent>
    </Card>
  );
} 