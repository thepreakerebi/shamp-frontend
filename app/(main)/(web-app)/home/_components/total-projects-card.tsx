"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FolderKanban } from "lucide-react";
import { useAnalytics } from '@/hooks/use-analytics';

export function TotalProjectsCard() {
  const { data, loading, error } = useAnalytics<{ count: number }>('/projects/count');

  return (
    <Card className="w-full max-w-[220px] shadow border border-muted bg-card/90 p-0">
      <CardContent className="flex flex-col items-center justify-center p-3 gap-2">
        <div className="flex items-center gap-2 w-full justify-center">
          <FolderKanban className="text-foreground" size={18} />
          <span className="text-2xl font-bold text-foreground tracking-tight">{loading ? <Loader2 className="animate-spin text-muted-foreground" size={18} /> : (data?.count ?? 0)}</span>
        </div>
        <div className="w-full text-center mt-1">
          <span className="block text-sm font-medium text-foreground">Projects</span>
          <span className="block text-xs text-muted-foreground">Total in workspace</span>
        </div>
        {error && <span className="text-destructive text-xs mt-1">{error}</span>}
      </CardContent>
    </Card>
  );
} 