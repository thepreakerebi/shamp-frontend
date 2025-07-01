"use client";
import { Card } from "@/components/ui/card";
import { Issue } from "@/lib/store/issues";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIssues } from "@/hooks/use-issues";
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface IssueCardProps {
  issue: Issue;
}

export function IssueCard({ issue }: IssueCardProps) {
  const { resolveIssue, deleteIssue } = useIssues();
  const [submitting, setSubmitting] = useState(false);

  const unresolved = !issue.resolved;

  const handleToggleResolve = async () => {
    try {
      setSubmitting(true);
      await resolveIssue(issue._id, unresolved);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await deleteIssue(issue._id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="flex flex-col gap-2 p-4 break-words">
      {/* Top row: avatar + names */}
      <section className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage alt={issue.personaName} />
          <AvatarFallback>{issue.personaName?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">{issue.personaName || "Unknown Persona"}</span>
          <span className="text-xs text-muted-foreground truncate">{issue.testName || "Unnamed Test"}</span>
        </div>
      </section>

      {/* Issue content */}
      <section className="text-xs text-foreground space-y-2 mt-2">
        {issue.uiIssues.length > 0 && (
          <div>
            <p className="font-semibold mb-1">UI Issues</p>
            <ul className="list-disc ml-4 space-y-1">
              {issue.uiIssues.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {issue.copyIssues.length > 0 && (
          <div>
            <p className="font-semibold mb-1">Copy Issues</p>
            <ul className="list-disc ml-4 space-y-1">
              {issue.copyIssues.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {issue.interactionIssues.length > 0 && (
          <div>
            <p className="font-semibold mb-1">Interaction Issues</p>
            <ul className="list-disc ml-4 space-y-1">
              {issue.interactionIssues.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Actions row */}
      <section className="mt-3 flex items-center justify-between gap-2 text-xs">
        {unresolved ? (
          <Badge variant="destructive" className="gap-1"><AlertCircle className="size-3" /> Unresolved</Badge>
        ) : (
          <Badge className="gap-1 bg-green-500 text-white dark:bg-green-600"><CheckCircle className="size-3" /> Resolved</Badge>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled={submitting} onClick={handleToggleResolve}>
            {unresolved ? <CheckCircle2 className="size-4 text-green-500" /> : <XCircle className="size-4 text-zinc-500" />}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={submitting}>
                <Trash2 className="size-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete issue?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="outline" onClick={() => {}}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={submitting}>Delete</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </Card>
  );
} 