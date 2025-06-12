"use client";
import { Badge } from "@/components/ui/badge";

export function ProjectBadge({ name }: { name: string }) {
  return <Badge variant="secondary" className="text-xs font-medium whitespace-nowrap">{name}</Badge>;
} 