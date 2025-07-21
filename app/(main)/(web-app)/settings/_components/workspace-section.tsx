"use client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function WorkspaceSection() {
  const { user, updateWorkspace, workspaceSettings, loading } = useAuth();

  const [form, setForm] = useState({ 
    name: "", 
    maxAgentStepsDefault: 50 
  });
  const [saving, setSaving] = useState(false);

  // Initialize form when data is available
  useEffect(() => {
    if (user?.currentWorkspace && workspaceSettings) {
      setForm({ 
        name: user.currentWorkspace.name ?? "", 
        maxAgentStepsDefault: workspaceSettings.maxAgentStepsDefault ?? 50 
      });
    }
  }, [user?.currentWorkspace?.name, workspaceSettings?.maxAgentStepsDefault]);

  const dirty =
    form.name.trim() !== (user?.currentWorkspace?.name ?? "") ||
    form.maxAgentStepsDefault !== (workspaceSettings?.maxAgentStepsDefault ?? 50);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Return') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!dirty) return;
    
    setSaving(true);
    try {
      await updateWorkspace({ 
        name: form.name.trim(), 
        maxAgentStepsDefault: form.maxAgentStepsDefault 
      });
      toast.success("Workspace settings updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update workspace settings");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.currentWorkspaceRole !== 'admin') return null;

  return (
    <section className="p-4 space-y-6 max-w-md">
      <h2 className="text-xl font-semibold">Workspace Settings</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="workspaceName" className="text-sm font-medium">Workspace name</label>
          <Input
            id="workspaceName"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            onKeyDown={handleKeyDown}
            disabled={saving || loading}
            placeholder="Enter workspace name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="maxAgentSteps" className="text-sm font-medium">
            Default max agent steps
          </label>
          <Input
            id="maxAgentSteps"
            type="number"
            min="50"
            max="150"
            value={form.maxAgentStepsDefault}
            onChange={e => setForm({ ...form, maxAgentStepsDefault: parseInt(e.target.value) || 50 })}
            onKeyDown={handleKeyDown}
            disabled={saving || loading}
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of steps the agent can take when running tests (50-150)
          </p>
        </div>
        <Button 
          type="button" 
          onClick={handleSave}
          disabled={!dirty || saving || loading} 
          className="mt-2 flex items-center gap-2"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  );
} 