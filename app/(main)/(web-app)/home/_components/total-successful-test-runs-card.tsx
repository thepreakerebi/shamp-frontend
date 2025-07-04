"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { CountCardSkeleton } from "./count-card-skeleton";
import Link from "next/link";
import { useTestRuns } from "@/hooks/use-testruns";

interface TotalSuccessfulTestRunsCardProps {
  href?: string;
}

export function TotalSuccessfulTestRunsCard({ href }: TotalSuccessfulTestRunsCardProps) {
  const { successfulCount, countsLoading, countsError } = useTestRuns();

  const card = (
    <Card className="w-full md:max-w-sm lg:col-span-5 bg-card/90 p-0">
      <CardContent className="flex flex-col items-center justify-center p-3 gap-2">
        <section className="flex items-center gap-2 w-full justify-center">
          <CheckCircle2 className="text-green-500 dark:text-green-400" size={18} />
          <h1 className="text-2xl font-bold text-green-500 dark:text-green-400 tracking-tight">{successfulCount ?? 0}</h1>
        </section>
        <section className="w-full text-center mt-1">
          <h2 className="block text-sm font-medium text-foreground">Successful Runs</h2>
          <h3 className="block text-xs text-muted-foreground">Total successful test runs</h3>
        </section>
        {countsError && <p className="text-destructive text-xs mt-1">{String(countsError)}</p>}
      </CardContent>
    </Card>
  );

  if (countsLoading && successfulCount === null) return <CountCardSkeleton />;
  
  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-ring rounded-md hover:scale-[1.03] transition-transform">
        {card}
      </Link>
    );
  }
  return card;
} 