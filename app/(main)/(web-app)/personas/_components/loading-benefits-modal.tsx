"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button"; // Stop button disabled
import { AlertTriangle, CheckCircle, DollarSign, RefreshCcw } from "lucide-react";
// import { usePersonas } from "@/hooks/use-personas";
// import { useBatchPersonas } from "@/hooks/use-batch-personas";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

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
  // const [currentId, setCurrentId] = React.useState<string | null>(null);
  // const [stopping, setStopping] = React.useState(false); // Commented out – stop button disabled for now
  // const [mode, setMode] = React.useState<"single" | "batch" | null>(null);

  // const { stopPersonaCreation } = usePersonas();
  // const { stopBatchPersonaCreation } = useBatchPersonas(false);
  // const router = useRouter();

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
      const detail = (e as CustomEvent<unknown>).detail as
        | boolean
        | { loading: boolean; id?: string; type?: "single" | "batch" };
      if (typeof detail === "boolean") {
        setOpen(detail);
        if (detail) {
          // setMode(e.type === "create-persona-loading" ? "single" : "batch");
        } else {
          // setCurrentId(null);
          // setMode(null);
        }
      } else if (detail && typeof detail === "object") {
        setOpen(Boolean(detail.loading));
        // setCurrentId(detail.id ?? null);
        // setMode(detail.type ?? null);
        if (!detail.loading) {
          // setCurrentId(null);
          // setMode(null);
        }
      }
    };
    window.addEventListener("create-persona-loading", handler as EventListener);
    window.addEventListener("create-batch-persona-loading", handler as EventListener);
    return () => {
      window.removeEventListener("create-persona-loading", handler as EventListener);
      window.removeEventListener("create-batch-persona-loading", handler as EventListener);
    };
  }, []);

  // const onStop = async () => {
  //   /* Stop button disabled */
  // };

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
        {/* Stop button temporarily disabled */}
      </DialogContent>
    </Dialog>
  );
} 