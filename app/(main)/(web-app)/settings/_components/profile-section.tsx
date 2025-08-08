"use client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export function ProfileSection() {
  const { user, updateProfile, loading, deleteAccount, logout } = useAuth();

  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName ?? "", lastName: user.lastName ?? "" });
    }
  }, [user]);

  const dirty =
    form.firstName.trim() !== (user?.firstName ?? "") ||
    form.lastName.trim() !== (user?.lastName ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    try {
      await updateProfile({ firstName: form.firstName.trim(), lastName: form.lastName.trim() });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      // Ensure local logout state (safety, in case backend already removed session)
      logout();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <section className="p-4 space-y-6 max-w-md">
      <h2 className="text-xl font-semibold">Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium">First name</label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={e => setForm({ ...form, firstName: e.target.value })}
            disabled={saving || loading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={e => setForm({ ...form, lastName: e.target.value })}
            disabled={saving || loading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" value={user?.email ?? ""} disabled readOnly />
        </div>
        <Button type="submit" disabled={!dirty || saving || loading} className="mt-2 flex items-center gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
      <Separator className="my-6" />

      {/* Danger zone */}
      <section className="border rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <section className="space-y-1">
          <h3 className="text-lg font-semibold text-destructive">Danger zone</h3>
          <p className="text-sm text-muted-foreground">
            Be careful. Account deletion cannot be undone.
          </p>
        </section>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              disabled={deleting}
              className="shrink-0"
            >
              <Trash2 className="size-4" />
              Delete account
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>Delete account</DialogTitle>
              <DialogDescription>
                This will permanently delete your account and all associated data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={deleting}>Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2"
              >
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Yes, delete my account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </section>
  );
} 