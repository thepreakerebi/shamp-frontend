"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { CountCardSkeleton } from "./count-card-skeleton";
import Link from "next/link";
import { useTestRuns } from "@/hooks/use-testruns";

interface TotalFailedTestRunsCardProps {
  href?: string;
}

export function TotalFailedTestRunsCard({ href }: TotalFailedTestRunsCardProps) {
  const { failedCount, fetchFailedCount } = useTestRuns();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchFailedCount().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [fetchFailedCount]);

  const card = (
    <Card className="w-full md:max-w-sm lg:col-span-5 bg-card/90 p-0">
      <CardContent className="flex flex-col items-center justify-center p-3 gap-2">
        <section className="flex items-center gap-2 w-full justify-center">
          <XCircle className="text-red-500 dark:text-red-400" size={18} />
          <h1 className="text-2xl font-bold text-red-500 dark:text-red-400 tracking-tight">{failedCount ?? 0}</h1>
        </section>
        <section className="w-full text-center mt-1">
          <h2 className="block text-sm font-medium text-foreground">Failed Runs</h2>
          <h3 className="block text-xs text-muted-foreground">Total failed test runs</h3>
        </section>
      </CardContent>
    </Card>
  );

  if (loading && failedCount === null) return <CountCardSkeleton />;
  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-ring rounded-md hover:scale-[1.03] transition-transform">
        {card}
      </Link>
    );
  }
  return card;
} 