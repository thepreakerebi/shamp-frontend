"use client";
import { Test } from "@/hooks/use-tests";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

interface AnalysisResult {
  overallSuccessRate?: {
    succeeded: number;
    failed: number;
    partial: number;
    total: number;
    successPercent: number;
  };
  commonFrustrations?: string[];
  blockers?: string[];
  uiIssues?: string[];
  accessibilityIssues?: string[];
  improvementSuggestions?: string[];
  overallSummary?: string;
  aggregateStats?: {
    averageSteps?: number;
    averageErrors?: number;
    averageBacktracks?: number;
  };
  sentimentDistribution?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export default function AnalysisSection({ test }: { test: Test }) {
  const analysisArr = (test as unknown as { analysis?: { result: AnalysisResult; createdAt?: string; _id: string }[] }).analysis ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(analysisArr.length ? analysisArr[0]._id : null);

  const selected = analysisArr.find(a => a._id === selectedId) ?? null;

  if (!selected) {
    return (
      <article className="p-4 space-y-4">
        <p className="text-muted-foreground">No analysis available yet.</p>
      </article>
    );
  }

  const result = selected.result || ({} as AnalysisResult);
  const {
    overallSuccessRate,
    aggregateStats,
    overallSummary,
    commonFrustrations,
    blockers,
    uiIssues,
    accessibilityIssues,
    improvementSuggestions,
  } = result;

  const listSections: { label: string; items?: string[] }[] = [
    { label: "Common frustrations", items: commonFrustrations },
    { label: "Blockers", items: blockers },
    { label: "UI issues", items: uiIssues },
    { label: "Accessibility issues", items: accessibilityIssues },
    { label: "Improvement suggestions", items: improvementSuggestions },
  ];

  return (
    <article className="p-4 space-y-6" aria-labelledby="analysis-heading">
      {/* Header with dropdown */}
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h2 id="analysis-heading" className="text-xl font-semibold">Analysis details</h2>
        {analysisArr.length > 1 && (
          <Select value={selectedId ?? undefined} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[220px] h-8">
              <SelectValue placeholder="Select analysis" />
            </SelectTrigger>
            <SelectContent>
              {analysisArr.map((a, idx) => {
                const label = a.createdAt
                  ? new Date(a.createdAt).toLocaleString(undefined, {
                      month: 'long', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit'
                    })
                  : `Analysis ${idx + 1}`;
                return (
                  <SelectItem key={a._id} value={a._id}>{label}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </section>

      {/* Summary */}
      {overallSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Overall summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {overallSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Success rate */}
      {overallSuccessRate && (
        <Card>
          <CardHeader>
            <CardTitle>Success rate</CardTitle>
            {overallSuccessRate.total !== undefined && (
              <CardDescription>
                {overallSuccessRate.successPercent}% success across {overallSuccessRate.total}{" "}
                {overallSuccessRate.total === 1 ? "run" : "runs"}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {overallSuccessRate.successPercent !== undefined && (
              <Progress value={overallSuccessRate.successPercent} />
            )}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                ✓ {overallSuccessRate.succeeded} succeeded
              </Badge>
              <Badge
                variant="secondary"
                className="bg-red-500/10 text-red-700 dark:text-red-400"
              >
                ✗ {overallSuccessRate.failed} failed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aggregate stats */}
      {aggregateStats && (
        <Card>
          <CardHeader>
            <CardTitle>Aggregate stats</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              {aggregateStats.averageSteps !== undefined && (
                <li>Average steps: {aggregateStats.averageSteps}</li>
              )}
              {aggregateStats.averageErrors !== undefined && (
                <li>Average errors: {aggregateStats.averageErrors}</li>
              )}
              {aggregateStats.averageBacktracks !== undefined && (
                <li>
                  Average backtracks: {aggregateStats.averageBacktracks}
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* List sections */}
      {listSections.map(({ label, items }) =>
        items && items.length ? (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                {items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null
      )}

      <Separator className="!my-0" />
    </article>
  );
} 