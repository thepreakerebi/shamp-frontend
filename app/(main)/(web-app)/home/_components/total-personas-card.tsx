"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { CountCardSkeleton } from "./count-card-skeleton";
import Link from "next/link";
import { useSmartPolling } from "@/hooks/use-smart-polling";
import { useAuth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";

interface TotalPersonasCardProps {
  href?: string;
}

export function TotalPersonasCard({ href }: TotalPersonasCardProps) {
  const { token } = useAuth();
  const { data, loading, error } = useSmartPolling<{ count: number }>(
    async () => {
      if (!token) throw new Error("Not authenticated");
      const url = `${API_BASE}/personas/count`;
      const res = await fetch(url, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    2000
  );

  const card = (
    <Card className="w-full md:max-w-sm bg-card/90 p-0">
      <CardContent className="flex flex-col items-center justify-center p-3 gap-2">
        <section className="flex items-center gap-2 w-full justify-center">
          <Users className="text-foreground" size={18} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{data?.count ?? 0}</h1>
        </section>
        <section className="w-full text-center mt-1">
          <h2 className="block text-sm font-medium text-foreground">Personas</h2>
          <h3 className="block text-xs text-muted-foreground">Total in workspace</h3>
        </section>
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      </CardContent>
    </Card>
  );

  if (loading && !data) return <CountCardSkeleton />;
  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus:ring-2 focus:ring-ring rounded-md hover:scale-[1.03] transition-transform">
        {card}
      </Link>
    );
  }
  return card;
} 