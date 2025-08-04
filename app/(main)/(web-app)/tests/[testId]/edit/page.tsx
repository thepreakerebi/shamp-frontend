/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTests } from "@/hooks/use-tests";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Laptop, Tablet, Smartphone, X } from "lucide-react";
import FileUploader, { PendingFile } from "@/components/ui/file-uploader";
import { fileToBase64 } from "@/lib/file-utils";
import ProjectCommand from "../../create/_components/project-command";
import PersonaCommand from "../../create/_components/persona-command";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBilling } from "@/hooks/use-billing";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

export default function EditTestPage() {
  const { testId } = useParams<{ testId: string }>();
  const { tests, updateTest, getTestById } = useTests();
  const router = useRouter();

  // Billing summary to determine plan capabilities
  const { summary } = useBilling();
  const planName = summary?.products && Array.isArray(summary.products) && summary.products.length > 0
    ? ((summary.products[0] as { name?: string; id?: string }).name || (summary.products[0] as { id?: string }).id || "").toLowerCase()
    : "free";
  const deviceSelectionEnabled = planName === "pro" || planName === "pro - annual" || planName === "ultra" || planName === "ultra - annual";

  const existing = tests?.find(t => t._id === testId);

  // Helpers to extract id whether value is string or populated object
  const getId = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value && (value as { _id?: string })._id) {
      return (value as { _id: string })._id;
    }
    return "";
  };

  const hasViewport = existing && (existing as any).browserViewportWidth !== undefined && (existing as any).browserViewportHeight !== undefined;
  const [initialLoaded, setInitialLoaded] = useState(!!existing && hasViewport);
  const [form, setForm] = useState<{ name: string; description: string; projectId: string; personaId: string; device: string }>(() => {
    const firstPersonaId = (() => {
      if (!existing) return "";
      const ex = existing as any;
      // prefer personas array
      if (Array.isArray(ex.personas) && ex.personas.length) {
        return getId(ex.personas[0]);
      }
      if (ex.persona) return getId(ex.persona);
      return "";
    })();
    const deviceInitial = (()=>{
      if (!existing) return "";
      const vpMap: Record<string,string> = {
        "1280x720":"desktop",
        "820x1180":"tablet",
        "800x1280":"mobile",
      };
      const key = `${(existing as any).browserViewportWidth ?? ""}x${(existing as any).browserViewportHeight ?? ""}`;
      return vpMap[key] || "";
    })();
    return {
      name: existing?.name || "",
      description: existing?.description || "",
      projectId: getId(existing?.project),
      personaId: firstPersonaId,
      device: deviceInitial,
    };
  });
  const [errors, setErrors] = useState<{ name?: string; description?: string; projectId?: string; personaId?: string; device?: string }>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<{ fileName: string; contentType: string }[]>(() => {
    if (existing && Array.isArray((existing as any).files)) return (existing as any).files as { fileName: string; contentType: string }[];
    return [];
  });
  const [saving, setSaving] = useState(false);

  // Unsaved changes dialog
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Determine if form has unsaved changes compared to initial form values
  const isDirty = useMemo(() => {
    if (saving || !initialLoaded) return false;
    const viewportMap: Record<string,string> = {
      desktop:"1280x720", tablet:"820x1180", mobile:"800x1280"
    };
    const initialDeviceKey = ((): string => {
      if (!existing) return "";
      const key = `${(existing as any).browserViewportWidth ?? ""}x${(existing as any).browserViewportHeight ?? ""}`;
      const inv = Object.entries(viewportMap).find(([,v])=>v===key);
      return inv ? inv[0] : "";
    })();
    const initial = {
      name: existing?.name || "",
      description: existing?.description || "",
      projectId: getId(existing?.project),
      personaId: (()=>{
        if(!existing) return "";
        const ex:any = existing;
        if (Array.isArray(ex.personas) && ex.personas.length) return getId(ex.personas[0]);
        if (ex.persona) return getId(ex.persona);
        return "";
      })(),
      device: initialDeviceKey,
    };
    return (
      form.name !== initial.name ||
      form.description !== initial.description ||
      form.projectId !== initial.projectId ||
      form.personaId !== initial.personaId ||
      form.device !== initial.device
    );
  }, [form, existing, getId, initialLoaded, saving]);

  // Intercept breadcrumb link clicks
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[data-slot="breadcrumb-link"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (!isDirty) return;
      if (anchor.href === window.location.href) return;
      e.preventDefault();
      setPendingHref(anchor.href);
      setConfirmLeaveOpen(true);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [isDirty]);

  // Fetch if missing or incomplete data (e.g., viewport sizes absent)
  useEffect(() => {
    const needsFetch = !existing || !hasViewport;
    if (needsFetch && testId) {
      (async () => {
        const t = await getTestById(testId);
        const firstPersonaId = (()=>{
          const anyT:any = t;
          if (Array.isArray(anyT.personas) && anyT.personas.length) return getId(anyT.personas[0]);
          if (anyT.persona) return getId(anyT.persona);
          return "";
        })();
        const deviceInitial = (()=>{
          const vpMap: Record<string,string> = {
            "1280x720":"desktop",
            "820x1180":"tablet",
            "800x1280":"mobile",
          };
          const key = `${(t as any).browserViewportWidth ?? ""}x${(t as any).browserViewportHeight ?? ""}`;
          return vpMap[key] || "";
        })();
        setForm({
          name: t.name,
          description: t.description || "",
          projectId: getId(t.project),
          personaId: firstPersonaId,
          device: deviceInitial,
        });
        setExistingFiles(Array.isArray((t as any).files) ? (t as any).files as any[] : []);
        setInitialLoaded(true);
      })();
    }
  }, [existing, hasViewport, testId, getTestById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.description) errs.description = "Description is required";
    if (!form.projectId) errs.projectId = "Project is required";
    if (!form.personaId) errs.personaId = "Persona is required";
    if (deviceSelectionEnabled && !form.device) errs.device = "Device type is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try{
      const viewportMap: Record<string,{w:number;h:number}> = {desktop:{w:1280,h:720}, tablet:{w:820,h:1180}, mobile:{w:800,h:1280}};
      const vp = deviceSelectionEnabled ? viewportMap[form.device as keyof typeof viewportMap] : viewportMap["desktop"];
      // Build file payloads
      const existingMetaPayload = existingFiles.map(meta=>({ fileName: meta.fileName, contentType: meta.contentType }));
      const newFilesPayload = await Promise.all(
        pendingFiles.map(async ({ file })=>({
          fileName: file.name,
          contentType: file.type,
          data: await fileToBase64(file),
        }))
      );
      const allFiles = [...existingMetaPayload, ...newFilesPayload];

      await updateTest(testId, {
        name: form.name,
        description: form.description,
        project: form.projectId,
        persona: form.personaId,
        browserViewportWidth: vp.w,
        browserViewportHeight: vp.h,
        ...(allFiles.length ? { files: allFiles as any } : {}),
      });
      toast.success("Test updated");
      router.push(`/tests/${testId}`);
    }catch(err){
      toast.error(err instanceof Error? err.message : "Failed to update test");
    }finally{ setSaving(false);}  
  };

  if(!initialLoaded){
    return <main className="p-6 text-center">Loading…</main>;
  }

  return (
    <main className="p-4 w-full max-w-[500px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Edit Test</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <section>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <Input id="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
        </section>
        <section>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
          <Textarea id="description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} aria-invalid={!!errors.description}/>
          {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Project</label>
          <ProjectCommand value={form.projectId} onChange={(id: string)=>{ setForm({...form, projectId:id}); setErrors({...errors, projectId: undefined}); }} />
          {errors.projectId && <p className="text-destructive text-xs mt-1">{errors.projectId}</p>}
        </section>
        <section>
          <label className="block text-sm font-medium mb-1">Persona</label>
          <PersonaCommand value={form.personaId} onChange={(id: string)=>{ setForm({...form, personaId:id}); setErrors({...errors, personaId: undefined}); }} />
          {errors.personaId && <p className="text-destructive text-xs mt-1">{errors.personaId}</p>}
        </section>
        {deviceSelectionEnabled && (
        <section>
          <label className="block text-sm font-medium mb-1">Device type</label>
          <RadioGroup value={form.device} onValueChange={(v)=>{setForm({...form, device:v}); setErrors({...errors, device:undefined});}} className="grid grid-cols-3 gap-2 md:max-w-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="desktop" id="device-desktop" />
              <Laptop className="size-5" />
              <span className="text-xs">Desktop</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="tablet" id="device-tablet" />
              <Tablet className="size-5" />
              <span className="text-xs">Tablet</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="mobile" id="device-mobile" />
              <Smartphone className="size-5" />
              <span className="text-xs">Mobile</span>
            </label>
          </RadioGroup>
          {errors.device && <p className="text-destructive text-xs mt-1">{errors.device}</p>}
        </section>
        )}
        {/* Existing attachments */}
        {existingFiles.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Current attachments</label>
            <ul className="mt-1 space-y-1 max-h-40 overflow-auto">
              {existingFiles.map((f, idx)=> (
                <li key={idx} className="flex items-center justify-between text-sm border rounded px-2 py-1">
                  <span className="truncate mr-2">{f.fileName}</span>
                  <button type="button" onClick={()=>{
                    const copy=[...existingFiles]; copy.splice(idx,1); setExistingFiles(copy);
                  }} className="text-muted-foreground hover:text-foreground"><X className="size-4"/></button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Add new attachments */}
        <FileUploader files={pendingFiles} setFiles={setPendingFiles} disabled={saving} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => {
            if (isDirty) {
              setConfirmLeaveOpen(true);
            } else {
              router.back();
            }
          }}>Cancel</Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            {saving && <Loader2 className="animate-spin size-4" />}
            {saving?"Saving…":"Save changes"}
          </Button>
        </div>
      </form>
      <UnsavedChangesDialog
        open={confirmLeaveOpen}
        onOpenChange={setConfirmLeaveOpen}
        onDiscard={() => {
          setConfirmLeaveOpen(false);
          if (pendingHref) {
            router.push(pendingHref);
          } else {
            router.back();
          }
        }}
      />
    </main>
  );
} 