"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useTests } from "@/hooks/use-tests";
import { useProjects } from "@/hooks/use-projects";
import { toast } from "sonner";

interface SelectTestsDialogProps {
  projectId: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  onStarted?: () => void;
}

export default function SelectTestsDialog({ projectId, open, setOpen, onStarted }: SelectTestsDialogProps) {
  const { tests } = useTests();
  const { runProjectTests, getProjectTestruns } = useProjects();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const projectTests = useMemo(() => {
    if (!tests) return [];
    return tests.filter((t) => {
      const proj = t.project;
      const pid = typeof proj === "string" ? proj : (proj as { _id: string })._id;
      return pid === projectId;
    });
  }, [tests, projectId]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleRun = async () => {
    if (!selected.length) return;
    setLoading(true);
    try {
      await runProjectTests(projectId, selected);
      try {
        await getProjectTestruns(projectId, true);
      } catch {
        /* ignore */
      }
      toast.success("Selected tests started");
      onStarted?.();
      setOpen(false);
      setSelected([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start tests");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelected([]); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select tests to run</DialogTitle>
        </DialogHeader>
        <section className="max-h-[60vh] overflow-auto space-y-2">
          {projectTests.map((t) => {
            const checked = selected.includes(t._id);
            return (
              <label
                key={t._id}
                className="flex items-start gap-3 p-2 border rounded-lg cursor-pointer hover:bg-muted"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(t._id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.name}</p>
                  {t.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                  )}
                </div>
              </label>
            );
          })}
          {projectTests.length === 0 && (
            <p className="text-sm text-muted-foreground">No tests found for this project.</p>
          )}
        </section>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={!selected.length || loading}>
            {loading ? "Starting…" : `Run selected (${selected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
