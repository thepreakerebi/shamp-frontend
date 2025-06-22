import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTests } from '@/hooks/use-tests';
import { useTestRuns } from '@/hooks/use-testruns';
import { toast } from 'sonner';

interface StartTestRunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartTestRunModal({ open, onOpenChange }: StartTestRunModalProps) {
  const { tests, testsLoading, refetch } = useTests();
  const { startTestRun } = useTestRuns();
  const [selected, setSelected] = useState<string>('');
  const [openSelect, setOpenSelect] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  const handleStart = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      const { testRun } = await startTestRun(selected);
      toast.success('Test run started');
      if (testRun && testRun._id) {
        window.open(`/testruns/${testRun._id}`, '_blank');
      }
      onOpenChange(false);
      setSelected('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start test run');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Start a test run</DialogTitle>
        </DialogHeader>
        <section>
          <Popover open={openSelect} onOpenChange={setOpenSelect}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {selected ? tests?.find(t=>t._id===selected)?.name : (testsLoading ? 'Loading tests…' : 'Select test')}
                <ChevronsUpDown className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search test..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No test found.</CommandEmpty>
                  {tests?.map(t => (
                    <CommandItem key={t._id} value={t.name} onSelect={()=>{setSelected(t._id); setOpenSelect(false);}}>
                      {t.name}
                      <Check className={`ml-auto size-4 ${selected===t._id?'opacity-100':'opacity-0'}`} />
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </section>
        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleStart} disabled={!selected || submitting || testsLoading} className="flex items-center gap-2">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? 'Starting…' : 'Start'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 