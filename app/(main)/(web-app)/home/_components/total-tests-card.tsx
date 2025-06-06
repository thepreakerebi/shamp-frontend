"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import { useAnalytics } from '@/hooks/use-analytics';
import { CountCardSkeleton } from "./count-card-skeleton";
import Link from "next/link";

interface TotalTestsCardProps {
  href?: string;
}

export function TotalTestsCard({ href }: TotalTestsCardProps) {
  const { data, loading, error } = useAnalytics<{ count: number }>('/tests/count');

  const card = (
    <Card className="w-full md:max-w-sm bg-card/90 p-0">
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

  if (loading) return <CountCardSkeleton />;
  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-ring rounded-md hover:scale-[1.03] transition-transform">
        {card}
      </Link>
    );
  }
  return card;
} 