"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, DollarSign, RefreshCcw } from "lucide-react";

const slides = [
  {
    title: "Uncover user frustrations instantly",
    description: "Identify pain points before you ship and fix them early.",
    Icon: AlertTriangle,
    anim: "animate-bounce",
  },
  {
    title: "Validate designs with synthetic users",
    description: "Run tests on AI personas to gather feedback in minutes, not weeks.",
    Icon: CheckCircle,
    anim: "animate-pulse",
  },
  {
    title: "Slash recruitment costs",
    description: "No more time-consuming interview scheduling or gift cards.",
    Icon: DollarSign,
    anim: "animate-bounce",
  },
  {
    title: "Iterate with confidence",
    description: "Ship features knowing they’ve been vetted by diverse personas.",
    Icon: RefreshCcw,
    anim: "animate-spin",
  },
] as const;

export function LoadingBenefitsModal() {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  // Cycle slides every 3 seconds
  React.useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [open]);

  // Listen to global events to toggle modal
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setOpen(Boolean(detail));
    };
    window.addEventListener("create-persona-loading", handler as EventListener);
    return () => window.removeEventListener("create-persona-loading", handler as EventListener);
  }, []);

  const slide = slides[index];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="rounded-3xl max-w-sm flex flex-col items-center text-center gap-4 py-8">
        {/* Visually hidden title for a11y */}
        <DialogHeader className="sr-only">
          <DialogTitle>Generating personas</DialogTitle>
        </DialogHeader>
        <slide.Icon className={`${slide.anim} text-secondary`} size={40} />
        <h2 className="text-lg font-semibold px-4">{slide.title}</h2>
        <p className="text-sm text-muted-foreground px-6">{slide.description}</p>
      </DialogContent>
    </Dialog>
  );
} 