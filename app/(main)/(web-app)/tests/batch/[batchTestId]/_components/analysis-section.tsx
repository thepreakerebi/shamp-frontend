"use client";
import { BatchTest } from "@/hooks/use-batch-tests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AnalysisResult {
  overallSummary?: string;
  // extend as needed
}

export default function AnalysisSection({ batch }: { batch: BatchTest }) {
  const rawArr = (batch as unknown as { analysis?: { result: AnalysisResult; createdAt?: string; _id: string }[] }).analysis ?? [];
  if (rawArr.length === 0) {
    return (
      <article className="p-4 space-y-4"><p className="text-muted-foreground">No analysis available yet.</p></article>
    );
  }
  const latest = [...rawArr].sort((a,b)=>{
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  })[0];

  const { overallSummary } = latest.result || {};

  return (
    <article className="p-4 space-y-6">
      {overallSummary && (
        <Card>
          <CardHeader><CardTitle>Overall summary</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-line leading-relaxed">{overallSummary}</p></CardContent>
        </Card>
      )}
      <Separator className="!my-0" />
    </article>
  );
} 