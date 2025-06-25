"use client";
import { useUsers } from '@/hooks/use-users';
import { MemberCard } from './member-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { MembersCardSkeleton } from './members-card-skeleton';
import { useState } from 'react';
import { InviteMemberModal } from './invite-member-modal';

export function MembersSection() {
  const { user } = useAuth();
  const { users, loading, error, deleteMember } = useUsers();
  const [open, setOpen] = useState(false);

  const handleRemove = (id: string) => { void deleteMember(id); }

  return (
    <section className="p-4 space-y-4">
      <header className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h2 className="text-xl font-semibold">Members</h2>
        <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => setOpen(true)}><Plus className="size-4"/>Invite member</Button>
      </header>
      {loading && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_,i)=>(<MembersCardSkeleton key={i}/>))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && users && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {users.map(u=> (
            <MemberCard key={u._id} user={u} canRemove={u._id!==user?._id} onRemove={handleRemove} />
          ))}
        </div>
      )}
      <InviteMemberModal open={open} onOpenChange={setOpen} />
    </section>
  );
} 