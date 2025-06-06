"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, FolderKanban } from "lucide-react";
// import { useAuth } from '@/lib/auth';
import { useAnalytics } from '@/hooks/use-analytics';
// const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export function TotalProjectsCard() {
  const { data, loading, error } = useAnalytics<{ count: number }>('/projects/count');

  return (
    <Card className="w-full max-w-xs shadow-md border-2 border-muted">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <FolderKanban className="text-primary" size={28} />
        <div>
          <CardTitle className="text-lg">Projects</CardTitle>
          <CardDescription>Total projects in your workspace</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-center min-h-[60px]">
        {loading ? (
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        ) : error ? (
          <span className="text-destructive text-sm">{error}</span>
        ) : (
          <span className="text-3xl font-bold text-primary">{data?.count ?? 0}</span>
        )}
      </CardContent>
    </Card>
  );
} 