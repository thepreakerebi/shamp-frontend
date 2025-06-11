"use client";
import { Button } from "@/components/ui/button";
import { Bot, UserX } from "lucide-react";
import Link from "next/link";

export default function PersonaNotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 w-full bg-background animate-fade-in">
      <div className="flex flex-col items-center gap-4 max-w-md w-full">
        <span className="relative flex items-center justify-center">
          <UserX className="text-muted-foreground" size={64} />
          <Bot className="absolute -bottom-4 -right-4 text-secondary animate-bounce" size={32} />
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-center text-foreground">Persona Not Found</h1>
        <p className="text-muted-foreground text-center text-base md:text-lg">
          Sorry, the persona you&apos;re looking for doesn&apos;t exist or has been deleted.<br />
          Our AI agents searched everywhere but couldn&apos;t find it!
        </p>
        <Link href="/personas" passHref>
          <Button className="mt-4 px-6 py-3 text-base font-semibold shadow-md" variant="secondary">
            Back to personas
          </Button>
        </Link>
      </div>
    </main>
  );
} 