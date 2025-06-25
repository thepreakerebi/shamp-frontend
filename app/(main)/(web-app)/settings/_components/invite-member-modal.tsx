"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useUsers } from '@/hooks/use-users';
import { toast } from 'sonner';

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (v: boolean)=>void;
}

export function InviteMemberModal({ open, onOpenChange }: InviteMemberModalProps) {
  const { inviteMember } = useUsers();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error,setError]=useState<string | null>(null);

  const handleSubmit = async () => {
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Valid email required'); return; }
    setError(null);
    setSending(true);
    try{
      await inviteMember({ email });
      setEmail('');
      onOpenChange(false);
    }catch(err){
      toast.error(err instanceof Error?err.message:'Failed to send invite');
    }finally{setSending(false);}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}> 
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>Send an invitation to join your workspace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} aria-invalid={!!error} />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={sending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={sending}>{sending?'Sending…':'Send invite'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 