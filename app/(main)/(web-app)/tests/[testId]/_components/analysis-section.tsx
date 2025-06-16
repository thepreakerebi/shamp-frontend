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
  const analysisArr = (test as unknown as { analysis?: { result: AnalysisResult }[] }).analysis;
  const latest = Array.isArray(analysisArr) && analysisArr.length > 0 ? analysisArr[0] : null;

  if (!latest) {
    return (
      <article className="p-4 space-y-4">
        <p className="text-muted-foreground">No analysis available yet.</p>
      </article>
    );
  }

  const result = latest.result || ({} as AnalysisResult);
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
      <h2 id="analysis-heading" className="sr-only">
        Analysis details
      </h2>

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