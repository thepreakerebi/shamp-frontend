"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { useAnalytics } from '@/hooks/use-analytics';
import { CountCardSkeleton } from "@/app/(main)/(web-app)/home/_components/count-card-skeleton";

export function TotalTestsCard() {
  const { data, loading, error } = useAnalytics<{ count: number }>('/tests/count');

  if (loading) return <CountCardSkeleton />;

  return (
    <Card className="w-full max-w-[220px] shadow border border-muted bg-card/90 p-0">
      <CardContent className="flex flex-col items-center justify-center p-3 gap-2">
        <section className="flex items-center gap-2 w-full justify-center">
          <ListChecks className="text-foreground" size={18} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{data?.count ?? 0}</h1>
        </section>
        <section className="w-full text-center mt-1">
          <h2 className="block text-sm font-medium text-foreground">Tests</h2>
          <h3 className="block text-xs text-muted-foreground">Total in workspace</h3>
        </section>
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      </CardContent>
    </Card>
  );
} 