"use client";
import React, { useState } from "react";
import FileUploader, { PendingFile } from "@/components/ui/file-uploader";
import { fileToBase64 } from "@/lib/file-utils";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
// import { Loader2 } from "lucide-react";
import { Laptop, Tablet, Smartphone } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTests } from "@/hooks/use-tests";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProjectCommand from "./_components/project-command";
import PersonaCommand from "./_components/persona-command";
import { useBilling } from "@/hooks/use-billing";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import RichTextEditor, { RichTextEditorHandle } from "../_components/rich-text-editor";

export default function CreateTestPage() {
  const { createTest } = useTests();
  const { summary } = useBilling();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", description: "", projectId: "", personaId: "", device: "" });
  const editorRef = React.useRef<RichTextEditorHandle | null>(null);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [errors, setErrors] = useState<{ name?: string; description?: string; projectId?: string; personaId?: string; device?: string }>({});
  const [loading, setLoading] = useState(false);

  // Broadcast loading to topbar
  React.useEffect(()=>{
    if(typeof window!=='undefined'){
      window.dispatchEvent(new CustomEvent('create-test-loading',{detail:loading}));
    }
  },[loading]);

  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const isDirty = React.useMemo(()=>{
    if (loading) return false;
    return (
      form.name || form.description || form.personaId || form.projectId || form.device
    );
  }, [form, loading]);

  React.useEffect(()=>{
    const handler = (e: MouseEvent)=>{
      const anchor = (e.target as HTMLElement).closest('a[data-slot="breadcrumb-link"]') as HTMLAnchorElement|null;
      if(!anchor) return;
      if(!isDirty) return;
      if(anchor.href===window.location.href) return;
      e.preventDefault();
      setPendingHref(anchor.href);
      setConfirmLeaveOpen(true);
    };
    document.addEventListener('click', handler, true);
    return ()=> document.removeEventListener('click', handler, true);
  },[isDirty]);

  const handleCancelNavigation = ()=>{
    if(isDirty){ setConfirmLeaveOpen(true);} else { router.back(); }
  };

  const planName = summary?.products && Array.isArray(summary.products) && summary.products.length > 0
    ? ((summary.products[0] as { name?: string; id?: string }).name || (summary.products[0] as { id?: string }).id || '').toLowerCase()
    : 'free';

  const deviceSelectionEnabled = planName === 'pro' || planName === 'pro - annual' || planName === 'ultra' || planName === 'ultra - annual';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const descriptionFromEditor = editorRef.current?.getPlainText() ?? form.description;
    if (!form.name) errs.name = "Name is required";
    if (!descriptionFromEditor) errs.description = "Description is required";
    if (!form.projectId) errs.projectId = "Project is required";
    if (!form.personaId) errs.personaId = "Persona is required";
    if (deviceSelectionEnabled && !form.device) errs.device = "Device type is required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const viewportMap: Record<string, { w: number; h: number }> = {
        desktop: { w: 1280, h: 720 },
        tablet: { w: 820, h: 1180 },
        mobile: { w: 360, h: 800 },
      };
      const vp = deviceSelectionEnabled ? viewportMap[form.device as keyof typeof viewportMap] : viewportMap["desktop"];
      // Build file payloads
      const filePayloads = await Promise.all(
        files.map(async ({ file }) => ({
          fileName: file.name,
          contentType: file.type,
          data: await fileToBase64(file),
        }))
      );

      const newTest = await createTest({
        name: form.name,
        description: descriptionFromEditor,
        project: form.projectId,
        persona: form.personaId,
        browserViewportWidth: vp.w,
        browserViewportHeight: vp.h,
        ...(filePayloads.length ? { files: filePayloads } : {}),
      });
      toast.success("Test created");
      if (newTest && newTest._id) {
        router.push(`/tests/${newTest._id}`);
      } else {
      router.push("/tests");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 w-full max-w-[1100px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Create Test</h1>
      <form onSubmit={handleSubmit} id="create-test-form" onKeyDown={(e)=>{if((e.key==='Enter'||e.key==='Return') && e.target instanceof HTMLElement && e.target.tagName!=='TEXTAREA'){e.preventDefault();const form=document.getElementById('create-test-form') as HTMLFormElement|null;form?.requestSubmit();}}}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Rich text editor */}
          <section className="space-y-2">
            <label className="block text-sm font-medium">Description</label>
            <RichTextEditor
              ref={editorRef}
              onPlainTextChange={(text)=>{
                setForm((prev)=> ({...prev, description: text}));
                if (text) setErrors((e)=> ({...e, description: undefined}));
              }}
              className="border rounded-lg overflow-hidden"
            />
            {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
          </section>

          {/* Right: other inputs */}
          <section className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <Input id="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Persona</label>
              <PersonaCommand value={form.personaId} onChange={(id) => {
                setForm({ ...form, personaId: id });
                setErrors({ ...errors, personaId: undefined });
              }} />
              {errors.personaId && <p className="text-destructive text-xs mt-1">{errors.personaId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <ProjectCommand value={form.projectId} onChange={(id) => {
                setForm({ ...form, projectId: id });
                setErrors({ ...errors, projectId: undefined });
              }} />
              {errors.projectId && <p className="text-destructive text-xs mt-1">{errors.projectId}</p>}
            </div>
            {deviceSelectionEnabled && (
              <div>
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
              </div>
            )}
            <div>
              <FileUploader files={files} setFiles={setFiles} disabled={loading} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancelNavigation}>Cancel</Button>
              {/* Topbar has the Create button */}
            </div>
          </section>
        </div>
      </form>
      <UnsavedChangesDialog
        open={confirmLeaveOpen}
        onOpenChange={setConfirmLeaveOpen}
        onDiscard={()=>{
          setConfirmLeaveOpen(false);
          if(pendingHref){ router.push(pendingHref);} else { router.back(); }
        }}
      />
    </main>
  );
} 