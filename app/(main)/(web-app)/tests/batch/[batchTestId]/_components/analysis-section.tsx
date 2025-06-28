"use client";
import { BatchTest } from "@/hooks/use-batch-tests";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface OverallFindings {
  universalIssues?: string[];
  universalSuccesses?: string[];
  outlierExperiences?: string[];
  summary?: string;
  aggregateStats?: {
    averageSteps?: number;
    averageErrors?: number;
    averageBacktracks?: number;
    successPercent?: number;
  };
}

interface PersonaFinding {
  personaName?: string;
  personaTraits?: string;
  summary?: string;
  notableIssues?: string[];
  notableSuccesses?: string[];
  sentiment?: string;
  goalsAchieved?: number;
  stepsCount?: number;
  errorsDetected?: number;
}

interface AnalysisResult {
  overallFindings?: OverallFindings;
  personaFindings?: PersonaFinding[];
}

interface AnalysisEntry {
  result: AnalysisResult;
  createdAt?: string;
  _id: string;
}

export default function AnalysisSection({ batch }: { batch: BatchTest }) {
  // Extract and sort analysis data (same logic as single test)
  const rawArr = (batch as BatchTest & { analysis?: AnalysisEntry[] }).analysis ?? [];
  const analysisArr = [...rawArr].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  const [selectedId, setSelectedId] = useState<string | null>(analysisArr.length ? analysisArr[0]._id : null);

  // When analysis array changes (e.g., after batch refetch), ensure a default is selected.
  useEffect(() => {
    if (!selectedId && analysisArr.length) {
      setSelectedId(analysisArr[0]._id);
    }
  }, [analysisArr.length, analysisArr, selectedId]);

  const selected = analysisArr.find(a => a._id === selectedId) ?? null;

  if (!selected) {
    return (
      <article className="p-4 space-y-4">
        <p className="text-muted-foreground">No analysis available yet.</p>
      </article>
    );
  }

  const overall = selected.result?.overallFindings;
  const personaFindings = selected.result?.personaFindings ?? [];

  const listSections: {label:string; items?: string[]}[] = [
    {label:"Universal issues", items: overall?.universalIssues},
    {label:"Universal successes", items: overall?.universalSuccesses},
    {label:"Outlier experiences", items: overall?.outlierExperiences},
  ];

  return (
    <article className="p-4 space-y-6" aria-labelledby="analysis-heading">
      {/* Header */}
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h2 id="analysis-heading" className="text-xl font-semibold">Batch analysis</h2>
        {analysisArr.length > 1 && (
          <Select value={selectedId ?? undefined} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[220px] h-8">
              <SelectValue placeholder="Select analysis" />
            </SelectTrigger>
            <SelectContent><ScrollArea className="h-48">
              {analysisArr.map((a, idx) => {
                const label = a.createdAt ? new Date(a.createdAt).toLocaleString(undefined,{month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : `Analysis ${idx + 1}`;
                return <SelectItem key={a._id} value={a._id}>{label}</SelectItem>;
              })}
            </ScrollArea></SelectContent>
          </Select>
        )}
      </section>

      {/* Overall summary */}
      {overall?.summary && (
        <Card>
          <CardHeader><CardTitle>Overall summary</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-line leading-relaxed">{overall.summary}</p></CardContent>
        </Card>
      )}

      {/* Aggregate stats badge row if present */}
      {overall?.aggregateStats && (
        <Card>
          <CardHeader><CardTitle>Aggregate stats</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {overall.aggregateStats.averageSteps!==undefined && <Badge variant="secondary">Avg steps: {overall.aggregateStats.averageSteps}</Badge>}
              {overall.aggregateStats.averageErrors!==undefined && <Badge variant="secondary">Avg errors: {overall.aggregateStats.averageErrors}</Badge>}
              {overall.aggregateStats.averageBacktracks!==undefined && <Badge variant="secondary">Avg backtracks: {overall.aggregateStats.averageBacktracks}</Badge>}
              {overall.aggregateStats.successPercent!==undefined && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Success: {overall.aggregateStats.successPercent}%</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Universal lists */}
      {listSections.map(({label,items})=>items && items.length ? (
        <Card key={label}>
          <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
          <CardContent><ul className="list-disc ml-6 space-y-1 text-sm">{items.map(it=><li key={it}>{it}</li>)}</ul></CardContent>
        </Card>
      ):null)}

      {/* Persona findings */}
      {personaFindings.length>0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Persona findings</h3>
          {personaFindings.map((p,idx)=>(
            <Card key={idx}>
              <CardHeader><CardTitle>{p.personaName || `Persona ${idx+1}`}</CardTitle><CardDescription>{p.personaTraits}</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {p.summary && <p className="text-sm whitespace-pre-line leading-relaxed">{p.summary}</p>}
                {(p.notableIssues && p.notableIssues.length) && (
                  <>
                    <h4 className="font-medium">Notable issues</h4>
                    <ul className="list-disc ml-6 space-y-1 text-sm">{p.notableIssues.map(i=><li key={i}>{i}</li>)}</ul>
                  </>
                )}
                {(p.notableSuccesses && p.notableSuccesses.length) && (
                  <>
                    <h4 className="font-medium">Notable successes</h4>
                    <ul className="list-disc ml-6 space-y-1 text-sm">{p.notableSuccesses.map(i=><li key={i}>{i}</li>)}</ul>
                  </>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                  {p.sentiment && <Badge variant="secondary">Sentiment: {p.sentiment}</Badge>}
                  {p.stepsCount!==undefined && <Badge variant="secondary">Steps: {p.stepsCount}</Badge>}
                  {p.errorsDetected!==undefined && <Badge variant="secondary">Errors: {p.errorsDetected}</Badge>}
                  {p.goalsAchieved!==undefined && <Badge variant="secondary">Goals achieved: {p.goalsAchieved}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <Separator className="!my-0" />
    </article>
  );
} 