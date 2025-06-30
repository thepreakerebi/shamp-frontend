"use client";
import { AppUser } from '@/lib/store/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface MemberCardProps {
  user: AppUser;
  canRemove: boolean;
  onRemove?: (id: string)=>void;
}

export function MemberCard({ user, canRemove, onRemove }: MemberCardProps) {
  const initials = user.fullName ? user.fullName.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'U';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <article className="flex items-center gap-4 p-4 rounded-2xl border dark:border-0 bg-card/80">
      <Avatar className="w-12 h-12 shrink-0">
        {user.profilePicture && <AvatarImage src={user.profilePicture} alt={user.fullName} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-medium leading-tight truncate" title={user.fullName}>{user.fullName}</h3>
        <p className="text-xs text-muted-foreground truncate" title={user.email}>{user.email}</p>
        <span className="text-xs font-medium capitalize text-secondary/80">{user.role}</span>
      </div>
      {canRemove && (
        <>
          <Button variant="ghost" size="icon" onClick={()=>setConfirmOpen(true)} aria-label="Remove member" className="ml-auto">
            <Trash2 className="size-4" />
          </Button>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Remove member?"
            description={`This will permanently remove ${user.fullName || 'this member'} from the workspace.`}
            confirmLabel="Remove"
            confirmVariant="destructive"
            loading={loading}
            onConfirm={async ()=>{
              if(!onRemove) return;
              try{
                setLoading(true);
                await onRemove(user._id);
              }finally{
                setLoading(false);
                setConfirmOpen(false);
              }
            }}
          />
        </>
      )}
    </article>
  );
} 