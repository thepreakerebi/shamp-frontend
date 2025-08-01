"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useTests } from "@/hooks/use-tests";
import { useUsers } from "@/hooks/use-users";
import { toast } from "sonner";

interface SelectWorkspaceTestsDialogProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  onStarted?: () => void;
}

export default function SelectWorkspaceTestsDialog({ open, setOpen, onStarted }: SelectWorkspaceTestsDialogProps) {
  const { tests } = useTests();
  const { runWorkspaceTests } = useUsers();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const available = useMemo(() => (tests ?? []).filter(t => !t.trashed), [tests]);
  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(i=>i!==id) : [...prev,id]);

  const handleRun = async () => {
    if (!selected.length) return;
    setLoading(true);
    try {
      await runWorkspaceTests(selected);
      toast.success("Selected tests started");
      onStarted?.();
      setOpen(false); setSelected([]);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v=>{setOpen(v); if(!v) setSelected([]);}}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Select tests to run</DialogTitle></DialogHeader>
        <ScrollArea className="h-[50vh] pr-2">
        <section className="space-y-3">
          {available.map(t=>{
            const checked=selected.includes(t._id);
            return (
              <label key={t._id} className="flex items-start gap-3 p-2 border rounded-lg cursor-pointer hover:bg-muted">
                <Checkbox checked={checked} onCheckedChange={()=>toggle(t._id)} className="mt-1"/>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.name}</p>
                  {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                </div>
              </label>
            );
          })}
          {available.length===0 && <p className="text-sm text-muted-foreground">No tests found.</p>}
          </section>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={()=>setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleRun} disabled={!selected.length||loading}>{loading? 'Starting…' : `Run selected (${selected.length})`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}