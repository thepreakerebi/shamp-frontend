"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Issue } from "@/lib/store/issues";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
}

export function IssueCard({ issue, onClick }: IssueCardProps) {
  const unresolved = !issue.resolved;
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium leading-snug truncate">
          {issue.testName || "Unnamed Test"}
        </CardTitle>
        {unresolved ? (
          <Badge className="flex items-center gap-1 bg-red-500 text-white dark:bg-red-600 dark:text-white">
            <AlertCircle className="size-3" /> Unresolved
          </Badge>
        ) : (
          <Badge className="flex items-center gap-1 bg-green-500 text-white dark:bg-green-600 dark:text-white">
            <CheckCircle className="size-3" /> Resolved
          </Badge>
        )}
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground space-y-1">
        <p><span className="font-medium text-foreground">Persona:</span> {issue.personaName || "-"}</p>
        <p><span className="font-medium text-foreground">UI:</span> {issue.uiIssues.length}</p>
        <p><span className="font-medium text-foreground">Copy:</span> {issue.copyIssues.length}</p>
        <p><span className="font-medium text-foreground">Interaction:</span> {issue.interactionIssues.length}</p>
      </CardContent>
    </Card>
  );
} 