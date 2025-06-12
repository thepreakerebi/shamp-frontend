"use client";
import { Badge } from "@/components/ui/badge";

export function PersonaBadge({ name }: { name: string }) {
  return <Badge variant="outline" className="text-xs font-medium whitespace-nowrap">{name}</Badge>;
} 