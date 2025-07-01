"use client";
import { Card } from "@/components/ui/card";
import { Issue } from "@/lib/store/issues";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Trash2, CheckCircle, XCircle, Copy } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIssues } from "@/hooks/use-issues";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface IssueCardProps {
  issue: Issue;
}

export function IssueCard({ issue }: IssueCardProps) {
  const { resolveIssue, deleteIssue } = useIssues();
  const [submitting, setSubmitting] = useState(false);
  const [optimisticResolved, setOptimisticResolved] = useState(issue.resolved);

  const unresolved = !optimisticResolved;

  // Sync optimistic state with prop changes
  useEffect(() => {
    setOptimisticResolved(issue.resolved);
  }, [issue.resolved]);

  // Handle navigation to test run
  const handleOpen: React.MouseEventHandler<HTMLDivElement> = () => {
    if (issue.testRunId) {
      window.open(`/testruns/${issue.testRunId}`, "_blank");
    }
  };

  const handleToggleResolve = async () => {
    try {
      setSubmitting(true);
      // Optimistically update the UI immediately
      const newResolvedState = unresolved;
      setOptimisticResolved(newResolvedState);
      await resolveIssue(issue._id, newResolvedState);
      
      // Show success toast
      toast.success(newResolvedState ? "Issue marked as resolved" : "Issue marked as unresolved");
    } catch {
      // Revert optimistic update on error
      setOptimisticResolved(issue.resolved);
      toast.error("Failed to update issue status");
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

  const handleCopy = async () => {
    try {
      // Combine all issue text into a single string
      const allIssues = [];
      
      if (issue.uiIssues.length > 0) {
        allIssues.push(`UI Issues:\n${issue.uiIssues.map(text => `• ${text}`).join('\n')}`);
      }
      
      if (issue.copyIssues.length > 0) {
        allIssues.push(`Copy Issues:\n${issue.copyIssues.map(text => `• ${text}`).join('\n')}`);
      }
      
      if (issue.interactionIssues.length > 0) {
        allIssues.push(`Interaction Issues:\n${issue.interactionIssues.map(text => `• ${text}`).join('\n')}`);
      }

      const fullText = `Issues for ${issue.personaName} - ${issue.testName}\n\n${allIssues.join('\n\n')}`;
      
      await navigator.clipboard.writeText(fullText);
      toast.success("Issues copied to clipboard");
    } catch {
      toast.error("Failed to copy issues");
    }
  };

  const handleCopySection = async (sectionType: string, issues: string[]) => {
    try {
      const sectionText = `${sectionType}:\n${issues.map(text => `• ${text}`).join('\n')}`;
      await navigator.clipboard.writeText(sectionText);
      toast.success(`${sectionType} copied to clipboard`);
    } catch {
      toast.error("Failed to copy section");
    }
  };

  return (
    <Card 
      className="flex flex-col gap-3 p-4 break-words h-fit cursor-pointer hover:bg-muted/60 transition-colors" 
      onClick={handleOpen}
    >
      {/* Top row: avatar + names */}
      <section className="flex items-center gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {issue.personaAvatarUrl && <AvatarImage alt={issue.personaName} src={issue.personaAvatarUrl} />}
          <AvatarFallback>{issue.personaName?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
        </Avatar>
        <section className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{issue.personaName || "Unknown Persona"}</span>
          <span className="text-xs text-muted-foreground truncate">{issue.testName || "Unnamed Test"}</span>
        </section>
      </section>

      {/* Issue content */}
      <section className="text-xs text-foreground flex flex-col gap-4">
        {issue.uiIssues.length > 0 && (
          <section 
            className="cursor-pointer rounded-md p-2 -m-2 transition-all duration-200 hover:scale-[1.02] hover:bg-muted/30 hover:border hover:border-red-200 hover:shadow-md dark:hover:border-red-800"
            onClick={(e) => {
              e.stopPropagation();
              handleCopySection("UI Issues", issue.uiIssues);
            }}
          >
            <p className="font-semibold mb-2 text-sm">UI Issues</p>
            <ul className="space-y-1">
              {issue.uiIssues.map((issueText, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="flex-1">{issueText}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {issue.copyIssues.length > 0 && (
          <section 
            className="cursor-pointer rounded-md p-2 -m-2 transition-all duration-200 hover:scale-[1.02] hover:bg-muted/30 hover:border hover:border-yellow-200 hover:shadow-md dark:hover:border-yellow-800"
            onClick={(e) => {
              e.stopPropagation();
              handleCopySection("Copy Issues", issue.copyIssues);
            }}
          >
            <p className="font-semibold mb-2 text-sm">Copy Issues</p>
            <ul className="space-y-1">
              {issue.copyIssues.map((issueText, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="flex-1">{issueText}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {issue.interactionIssues.length > 0 && (
          <section 
            className="cursor-pointer rounded-md p-2 -m-2 transition-all duration-200 hover:scale-[1.02] hover:bg-muted/30 hover:border hover:border-blue-200 hover:shadow-md dark:hover:border-blue-800"
            onClick={(e) => {
              e.stopPropagation();
              handleCopySection("Interaction Issues", issue.interactionIssues);
            }}
          >
            <p className="font-semibold mb-2 text-sm">Interaction Issues</p>
            <ul className="space-y-1">
              {issue.interactionIssues.map((issueText, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="flex-1">{issueText}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      {/* Actions row */}
      <section 
        className="flex items-center justify-between gap-2 text-xs mt-auto pt-2" 
        onClick={(e) => e.stopPropagation()} 
        data-stop-row
      >
        {unresolved ? (
          <Badge variant="destructive" className="gap-1 text-xs"><AlertCircle className="size-3" /> Unresolved</Badge>
        ) : (
          <Badge className="gap-1 bg-green-500 text-white dark:bg-green-600 text-xs"><CheckCircle className="size-3" /> Resolved</Badge>
        )}

        <section className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={submitting} onClick={handleToggleResolve} className="h-7 w-7">
            {unresolved ? <CheckCircle2 className="size-3.5 text-green-500" /> : <XCircle className="size-3.5 text-zinc-500" />}
          </Button>

          <Button variant="ghost" size="icon" disabled={submitting} onClick={handleCopy} className="h-7 w-7">
            <Copy className="size-3.5 text-blue-500" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={submitting} className="h-7 w-7">
                <Trash2 className="size-3.5 text-red-500" />
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
        </section>
      </section>
    </Card>
  );
} 