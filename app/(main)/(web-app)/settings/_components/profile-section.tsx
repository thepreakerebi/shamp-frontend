"use client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?');
      if (!confirmed) return;
    }
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
      <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="flex items-center gap-2">
        {deleting && <Loader2 className="size-4 animate-spin" />}
        Delete account
      </Button>
    </section>
  );
} 