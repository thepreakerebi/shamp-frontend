"use client";
import React, { useState } from "react";
import FileUploader, { PendingFile } from "@/components/ui/file-uploader";
import { fileToBase64 } from "@/lib/file-utils";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
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
  const [stickyTopPx, setStickyTopPx] = useState<number>(100); // fallback ~64(topbar)+60

  // Broadcast loading to topbar
  React.useEffect(()=>{
    if(typeof window!=='undefined'){
      window.dispatchEvent(new CustomEvent('create-test-loading',{detail:loading}));
    }
  },[loading]);

  // Compute sticky top based on topbar height + 60px
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

  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const isDirty = React.useMemo(()=>{
    if (loading) return false;
    return (
      form.name || form.description || form.personaId || form.projectId || form.device
    );
  }, [form, loading]);

  // Broadcast dirty state to topbar
  React.useEffect(()=>{
    if(typeof window!=='undefined'){
      window.dispatchEvent(new CustomEvent('create-test-dirty',{detail:isDirty}));
    }
  },[isDirty]);

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

  // Cancel handled from Topbar

  const planName = summary?.products && Array.isArray(summary.products) && summary.products.length > 0
    ? ((summary.products[0] as { name?: string; id?: string }).name || (summary.products[0] as { id?: string }).id || '').toLowerCase()
    : 'free';

  const deviceSelectionEnabled = planName === 'pro' || planName === 'pro - annual' || planName === 'ultra' || planName === 'ultra - annual' || planName === 'beta';

  // Remove untouched template blocks before saving
  const cleanDescriptionBlocks = React.useCallback((blocks: unknown): unknown[] => {
    if (!Array.isArray(blocks)) return [];
    const placeholderTexts = new Set<string>([
      'One concise sentence describing exactly what should be achieved.',
      'Open the page and…',
      'Click … and fill …',
      'Submit and verify …',
      'What confirms the task is done (e.g., dashboard visible)',
      'Stop immediately once success is confirmed',
      'If blocked after at most 2 retries, stop and summarize why',
      'Optional negative paths worth checking (if any)'
    ]);
    const headingNames = new Set<string>(['Goal','Steps','Success criteria','Stop conditions','Edge cases']);

    const readInline = (content: unknown): string => {
      if (!Array.isArray(content)) return '';
      return content
        .map((n: unknown) => {
          if (!n) return '';
          if (typeof n === 'string') return n;
          if (typeof n === 'object' && 'text' in (n as { text?: unknown })) return String((n as { text?: unknown }).text ?? '');
          if (typeof n === 'object' && 'content' in (n as { content?: unknown })) return readInline((n as { content?: unknown }).content);
          return '';
        })
        .join('');
    };

    type BNBlock = { type?: string; props?: Record<string, unknown>; content?: unknown };

    // First pass: drop empty or placeholder non-heading blocks
    const prelim: BNBlock[] = [];
    for (const raw of blocks as BNBlock[]) {
      const t = raw?.type ?? '';
      if (t.includes('heading')) {
        prelim.push(raw);
        continue;
      }
      const text = readInline(raw?.content).trim();
      if (!text) continue;
      if (placeholderTexts.has(text)) continue;
      prelim.push(raw);
    }

    // Second pass: keep a heading only if followed by at least one kept non-heading before the next heading
    const kept: BNBlock[] = [];
    for (let i = 0; i < prelim.length; i++) {
      const b = prelim[i];
      const isHeading = (b?.type ?? '').includes('heading');
      if (!isHeading) { kept.push(b); continue; }
      const headingText = readInline(b?.content).trim();
      // look ahead
      let hasContent = false;
      for (let j = i + 1; j < prelim.length; j++) {
        const next = prelim[j];
        const nextIsHeading = (next?.type ?? '').includes('heading');
        if (nextIsHeading) break;
        hasContent = true; break;
      }
      if (hasContent) {
        // keep heading, but if it is a known template heading and all its immediate child content are placeholders, still keep because some users may add content later in the section
        kept.push(b);
      } else if (!headingNames.has(headingText)) {
        // custom heading with no content yet → drop
      } else {
        // template heading with no user content → drop
      }
    }

    return kept as unknown[];
  }, []);

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

      const rawBlocks = editorRef.current?.getBlocks();
      const blocks = cleanDescriptionBlocks(rawBlocks as unknown);
      const newTest = await createTest({
        name: form.name,
        description: descriptionFromEditor,
        ...(blocks ? { descriptionBlocks: blocks } : {}),
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
    <main className="p-4 pb-20 w-full mx-auto space-y-6">
      <form onSubmit={handleSubmit} id="create-test-form" onKeyDown={(e)=>{if((e.key==='Enter'||e.key==='Return') && e.target instanceof HTMLElement && e.target.tagName!=='TEXTAREA'){e.preventDefault();const form=document.getElementById('create-test-form') as HTMLFormElement|null;form?.requestSubmit();}}}>
        <section className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8 items-start">
          {/* Left: other inputs */}
          <section className="space-y-4 md:max-w-[400px] w-full md:sticky self-start" style={{ top: stickyTopPx }}>
            <h1 className="text-2xl font-semibold">Create Test</h1>
            <section>
              <label htmlFor="name" className="block text-sm font-medium">Name</label>
              <p className="text-xs text-muted-foreground mb-1">The name you want to call this test (e.g., account creation flow).</p>
              <Input id="name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </section>
            <section>
              <label className="block text-sm font-medium mb-1">Persona</label>
              <PersonaCommand value={form.personaId} onChange={(id) => {
                setForm({ ...form, personaId: id });
                setErrors({ ...errors, personaId: undefined });
              }} />
              {errors.personaId && <p className="text-destructive text-xs mt-1">{errors.personaId}</p>}
            </section>
            <section>
              <label className="block text-sm font-medium mb-1">Project</label>
              <ProjectCommand value={form.projectId} onChange={(id) => {
                setForm({ ...form, projectId: id });
                setErrors({ ...errors, projectId: undefined });
              }} />
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
            <section>
              <FileUploader files={files} setFiles={setFiles} disabled={loading} />
            </section>
            {/* Topbar has the Cancel and Create buttons */}
          </section>

            {/* Right: Rich text editor */}
          <section className="space-y-2 min-w-0 w-full">
            <h1 className="text-2xl font-semibold invisible select-none pointer-events-none">Create Test</h1>
            <label className="block text-sm font-medium">Description</label>
            <p className="text-xs text-muted-foreground mb-1">Describe the exact goal and steps. Replace the placeholder text inside each block, and add or remove blocks using the + button or typing &#34;/&#34; for commands.</p>
            <RichTextEditor
              ref={editorRef}
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
        onDiscard={()=>{
          setConfirmLeaveOpen(false);
          if(pendingHref){ router.push(pendingHref);} else { router.back(); }
        }}
      />
    </main>
  );
} 