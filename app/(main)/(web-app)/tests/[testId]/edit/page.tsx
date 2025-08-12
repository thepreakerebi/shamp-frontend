/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTests } from "@/hooks/use-tests";
import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Loader2 } from "lucide-react";
import { Laptop, Tablet, Smartphone, X, FileText, FileImage } from "lucide-react";
import TestFormSkeleton from "../_components/test-form-skeleton";
import FileUploader, { PendingFile } from "@/components/ui/file-uploader";
import { fileToBase64 } from "@/lib/file-utils";
import ProjectCommand from "../../create/_components/project-command";
import PersonaCommand from "../../create/_components/persona-command";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBilling } from "@/hooks/use-billing";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import RichTextEditor, { RichTextEditorHandle } from "../../_components/rich-text-editor";

export default function EditTestPage() {
  const { testId } = useParams<{ testId: string }>();
  const { tests, updateTest, getTestById } = useTests();
  const router = useRouter();

  // Billing summary to determine plan capabilities
  const { summary } = useBilling();
  const planName = summary?.products && Array.isArray(summary.products) && summary.products.length > 0
    ? ((summary.products[0] as { name?: string; id?: string }).name || (summary.products[0] as { id?: string }).id || "").toLowerCase()
    : "free";
  const deviceSelectionEnabled = planName === "pro" || planName === "pro - annual" || planName === "ultra" || planName === "ultra - annual" || planName === "beta";

  const existing = tests?.find(t => t._id === testId);

  // Helpers to extract id whether value is string or populated object
  const getId = React.useCallback((value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value && (value as { _id?: string })._id) {
      return (value as { _id: string })._id;
    }
    return "";
  }, []);

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
        "360x800":"mobile",
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
  const [stickyTopPx, setStickyTopPx] = useState<number>(100);

  // Editor ref and initial blocks (hooks at component top-level)
  const editorRef = React.useRef<RichTextEditorHandle | null>(null);
  const [initialBlocksState, setInitialBlocksState] = useState<unknown[] | undefined>(() => {
    const fromExisting = (existing as unknown as { descriptionBlocks?: unknown[] })?.descriptionBlocks;
    return Array.isArray(fromExisting) && fromExisting.length ? fromExisting : undefined;
  });
  const editorKey = React.useMemo(() => {
    try {
      const sig = Array.isArray(initialBlocksState) ? JSON.stringify(initialBlocksState).length : 0;
      return `rte-${testId}-${sig}`;
    } catch {
      return `rte-${testId}-0`;
    }
  }, [initialBlocksState, testId]);

  // Broadcast loading to topbar
  React.useEffect(()=>{
    if(typeof window!=='undefined'){
      window.dispatchEvent(new CustomEvent('edit-test-loading',{detail:saving}));
    }
  },[saving]);

  // Compute sticky top based on topbar height + 60px (match create page)
  React.useEffect(()=>{
    const compute = ()=>{
      const el = document.querySelector('[data-topbar]') as HTMLElement | null;
      const h = el ? el.getBoundingClientRect().height : 64;
      setStickyTopPx(Math.max(0, Math.round(h + 60)));
    };
    compute();
    window.addEventListener('resize', compute);
    return ()=> window.removeEventListener('resize', compute);
  },[]);

  // Unsaved changes dialog
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Determine if form has unsaved changes compared to initial form values
  const isDirty = useMemo(() => {
    if (saving || !initialLoaded) return false;
    const viewportMap: Record<string,string> = {
      desktop:"1280x720", tablet:"820x1180", mobile:"360x800"
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

  // Broadcast dirty state for topbar Cancel button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edit-test-dirty', { detail: isDirty }));
    }
  }, [isDirty]);

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

  // Sync initialBlocksState from store if it becomes available after mount
  useEffect(() => {
    const fromExisting = (existing as unknown as { descriptionBlocks?: unknown[] })?.descriptionBlocks;
    if (!initialBlocksState && Array.isArray(fromExisting) && fromExisting.length) {
      setInitialBlocksState(fromExisting);
    }
  }, [existing, initialBlocksState]);

  // Fetch if missing or incomplete data (e.g., viewport sizes or description blocks absent)
  useEffect(() => {
    const hasBlocks = Array.isArray((existing as any)?.descriptionBlocks) && (existing as any).descriptionBlocks.length > 0;
    const needsFetch = !existing || !hasViewport || !hasBlocks;
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
            "360x800":"mobile",
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
        const blocks = (t as unknown as { descriptionBlocks?: unknown[] })?.descriptionBlocks;
        setInitialBlocksState(Array.isArray(blocks) && blocks.length ? blocks : undefined);
        setExistingFiles(Array.isArray((t as any).files) ? (t as any).files as any[] : []);
        setInitialLoaded(true);
      })();
    }
  }, [existing, hasViewport, testId, getTestById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const descriptionFromEditor = editorRef.current?.getPlainText() ?? form.description;
    const hasGoal = editorRef.current?.getHasValidGoal() ?? false;
    if (!form.name) errs.name = "Name is required";
    if (!descriptionFromEditor || !hasGoal) errs.description = !hasGoal ? "Please provide a real Goal before submitting" : "Description is required";
    if (!form.projectId) errs.projectId = "Project is required";
    if (!form.personaId) errs.personaId = "Persona is required";
    if (deviceSelectionEnabled && !form.device) errs.device = "Device type is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try{
      const viewportMap: Record<string,{w:number;h:number}> = {desktop:{w:1280,h:720}, tablet:{w:820,h:1180}, mobile:{w:360,h:800}};
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

      const blocks = editorRef.current?.getBlocks();
      await updateTest(testId, {
        name: form.name,
        description: descriptionFromEditor,
        ...(blocks ? { descriptionBlocks: blocks as unknown } : {}),
        project: form.projectId,
        persona: form.personaId,
        browserViewportWidth: vp.w,
        browserViewportHeight: vp.h,
        files: allFiles as any,
      });
      toast.success("Test updated");
      router.push(`/tests/${testId}`);
    }catch(err){
      toast.error(err instanceof Error? err.message : "Failed to update test");
    }finally{ setSaving(false);}  
  };

  if(!initialLoaded){
    return <TestFormSkeleton/>;
  }

  return (
    <main className="p-4 w-full mx-auto space-y-6">
      <form onSubmit={handleSubmit} id="edit-test-form" onKeyDown={(e)=>{if((e.key==='Enter'||e.key==='Return') && e.target instanceof HTMLElement && e.target.tagName!=='TEXTAREA'){e.preventDefault(); const form=document.getElementById('edit-test-form') as HTMLFormElement|null; form?.requestSubmit();}}}>
        <section className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8 items-start">
          {/* Left: inputs (sticky) */}
          <section className="space-y-4 md:max-w-[400px] w-full md:sticky self-start" style={{ top: stickyTopPx }}>
            <h1 className="text-2xl font-semibold">Edit Test</h1>
            <section>
              <label htmlFor="name" className="block text-sm font-medium">Name</label>
              <Input id="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </section>
            <section>
              <label className="block text-sm font-medium mb-1">Persona</label>
              <PersonaCommand value={form.personaId} onChange={(id: string)=>{ setForm({...form, personaId:id}); setErrors({...errors, personaId: undefined}); }} />
              {errors.personaId && <p className="text-destructive text-xs mt-1">{errors.personaId}</p>}
            </section>
            <section>
              <label className="block text-sm font-medium mb-1">Project</label>
              <ProjectCommand value={form.projectId} onChange={(id: string)=>{ setForm({...form, projectId:id}); setErrors({...errors, projectId: undefined}); }} />
              {errors.projectId && <p className="text-destructive text-xs mt-1">{errors.projectId}</p>}
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
                  {existingFiles.map((f, idx)=> {
                    const isImage = f.contentType?.startsWith('image/');
                    const Icon = isImage ? FileImage : FileText;
                    return (
                    <li key={idx} className="flex items-center justify-between text-sm border rounded px-2 py-1">
                      <span className="flex items-center gap-1 truncate mr-2"><Icon className="size-4 shrink-0" /> {f.fileName}</span>
                      <button type="button" onClick={()=>{
                        const copy=[...existingFiles]; copy.splice(idx,1); setExistingFiles(copy);
                      }} className="text-muted-foreground hover:text-foreground"><X className="size-4"/></button>
                    </li>
                  );})}
                </ul>
              </div>
            )}
            {/* Add new attachments */}
            <FileUploader files={pendingFiles} setFiles={setPendingFiles} disabled={saving} />
          </section>

          {/* Right: Rich text editor */}
          <section className="space-y-2 min-w-0 w-full">
            <h1 className="text-2xl font-semibold invisible select-none pointer-events-none">Edit Test</h1>
            <label className="block text-sm font-medium">Description</label>
            <p className="text-xs text-muted-foreground mb-1">Describe the exact goal and steps. Replace the placeholder text inside each block, and add or remove blocks using the + button or typing &#34;/&#34; for commands.</p>
            <RichTextEditor
              key={editorKey}
              ref={editorRef}
              initialBlocks={initialBlocksState}
              onPlainTextChange={(text)=>{
                setForm((prev)=> ({...prev, description: text}));
                if (text) setErrors((e)=> ({...e, description: undefined}));
              }}
              className="rounded-lg overflow-hidden"
              invalid={!!errors.description}
            />
            {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
          </section>
        </section>
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