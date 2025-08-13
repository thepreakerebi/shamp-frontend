"use client";

import React from "react";
import { usePersonas } from "@/hooks/use-personas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoadingBenefitsModal } from "../_components/loading-benefits-modal";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import PersonaRichTextEditor, { PersonaRichTextEditorHandle, type PersonaStructured } from "../_components/persona-rich-text-editor";

export default function CreatePersonaPage() {
  const { createPersona } = usePersonas();
  const router = useRouter();

  const editorRef = React.useRef<PersonaRichTextEditorHandle | null>(null);
  const [structured, setStructured] = React.useState<PersonaStructured | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ name?: string; description?: string }>({});
  const [confirmLeaveOpen, setConfirmLeaveOpen] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const [stickyTopPx, setStickyTopPx] = React.useState<number>(100);

  const isDirty = React.useMemo(() => {
    if (loading) return false;
    const s = structured;
    return !!(
      (s && (s.name || s.description || s.background || s.gender ||
      (s.goals && s.goals.length) || (s.frustrations && s.frustrations.length) || (s.traits && s.traits.length) || (s.preferredDevices && s.preferredDevices.length)))
    );
  }, [structured, loading]);

  // Broadcast dirty state to topbar
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('create-persona-dirty', { detail: isDirty }));
    }
  }, [isDirty]);

  React.useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const anchor = t.closest('a[data-slot="breadcrumb-link"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (!isDirty) return;
      if (anchor.href === window.location.href) return;
      e.preventDefault();
      setPendingHref(anchor.href);
      setConfirmLeaveOpen(true);
    };
    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [isDirty]);

  React.useEffect(() => {
    const compute = () => {
      const el = document.querySelector('[data-topbar]') as HTMLElement | null;
      const h = el ? el.getBoundingClientRect().height : 64;
      setStickyTopPx(Math.max(0, Math.round(h + 60)));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Cancel handled by Topbar via create-persona-dirty broadcast

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const s = editorRef.current?.getStructuredPersona();
    const hasBasics = editorRef.current?.getHasValidBasics() ?? false;
    if (!hasBasics || !s) {
      const errs: { name?: string; description?: string } = {};
      if (!s?.name) errs.name = "Persona name is required.";
      if (!s?.description) errs.description = "Description is required.";
      setFieldErrors(errs);
      return;
    }
    setLoading(true);
    // Broadcast loading state for Topbar button
    window.dispatchEvent(new CustomEvent('create-persona-loading', { detail: true }));
    try {
      const persona = await createPersona({
        name: s.name,
        description: s.description,
        background: s.background || undefined,
        gender: s.gender || undefined,
        goals: s.goals && s.goals.length ? s.goals : undefined,
        frustrations: s.frustrations && s.frustrations.length ? s.frustrations : undefined,
        traits: s.traits && s.traits.length ? s.traits : undefined,
        preferredDevices: s.preferredDevices && s.preferredDevices.length ? s.preferredDevices : undefined,
      });
      toast.success("New persona created!");
      router.push(`/personas/${persona._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create persona");
    } finally {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('create-persona-loading', { detail: false }));
    }
  };

  return (
    <section className="mx-auto w-full py-10 px-4 pb-20">
      <LoadingBenefitsModal />
      <h1 className="text-2xl sticky top-[76px] font-semibold mb-6">Create Persona</h1>
      {error && <div className="text-destructive text-sm mb-4">{error}</div>}
      <form noValidate id="create-persona-form" onSubmit={handleSubmit}
        onKeyDown={(e)=>{ if((e.key==="Enter"||e.key==="Return") && e.target instanceof HTMLElement && e.target.tagName!=="TEXTAREA"){ e.preventDefault(); const form=document.getElementById('create-persona-form') as HTMLFormElement|null; form?.requestSubmit(); } }}
      >
        <section className="grid grid-cols-1 md:grid-cols-[minmax(260px,300px)_1fr] gap-8 items-start">
          <aside className="hidden lg:block lg:w-[320px] shrink-0 sticky" style={{ top: Math.max(0, stickyTopPx) }}>
            <section className="border-r pr-4 space-y-4 bg-background">
              <section>
                <h2 className="text-sm font-semibold">How to write a good persona</h2>
                <p className="text-xs text-muted-foreground">Provide a clear <span className="font-medium">Name</span> and <span className="font-medium">Description</span> (required). Optionally add <span className="font-medium">Background</span>, <span className="font-medium">Gender</span>, <span className="font-medium">Goals</span>, <span className="font-medium">Frustrations</span>, <span className="font-medium">Traits</span>, and <span className="font-medium">Preferred devices</span>. You can also add your own sections (e.g., <span className="font-medium">Preconditions</span>, <span className="font-medium">Notes</span>) — they’ll be used as extra context. Use the <span className="font-medium">+</span> button or type <code>/heading</code>.</p>
              </section>
              <section className="space-y-3 text-xs">
                <section>
                  <p className="font-medium">Name (required)</p>
                  <p className="text-muted-foreground">First and last name, title-case if possible.</p>
                </section>
                <section>
                  <p className="font-medium">Description (required)</p>
                  <p className="text-muted-foreground">1–2 sentences describing who they are and what drives them.</p>
                </section>
                <section>
                  <p className="font-medium">Background (optional)</p>
                  <p className="text-muted-foreground">1–2 sentences describing their background and context.</p>
                </section>
                <section>
                  <p className="font-medium">Gender (optional)</p>
                  <p className="text-muted-foreground">Male, Female, or Prefer not to say.</p>
                </section>
                <section>
                  <p className="font-medium">Goals (optional)</p>
                  <ul className="list-disc list-inside text-muted-foreground"><li>What they want to achieve with your product</li></ul>
                </section>
                <section>
                  <p className="font-medium">Frustrations (optional)</p>
                  <ul className="list-disc list-inside text-muted-foreground"><li>Common blockers or pain points</li></ul>
                </section>
                <section>
                  <p className="font-medium">Traits (optional)</p>
                  <ul className="list-disc list-inside text-muted-foreground"><li>Behaviors or tendencies that affect usage</li></ul>
                </section>
                <section>
                  <p className="font-medium">Preferred devices (optional)</p>
                  <ul className="list-disc list-inside text-muted-foreground"><li>Desktop, Tablet, Mobile</li></ul>
                </section>
              </section>
            </section>
          </aside>

          <section className="min-w-0 space-y-2">
            <label className="block text-sm font-medium">Persona</label>
            <p className="text-xs text-muted-foreground mb-1">Fill the required <span className="font-medium">Name</span> and <span className="font-medium">Description</span>, then add any other sections you need. Use the + button or type <code>/</code> for commands. You can simply paste in a persona from another source.</p>
            {(fieldErrors.name || fieldErrors.description) && (
              <div className="text-destructive text-xs mb-1 space-y-1">
                {fieldErrors.name && <p>{fieldErrors.name}</p>}
                {fieldErrors.description && <p>{fieldErrors.description}</p>}
              </div>
            )}
            <PersonaRichTextEditor
              ref={editorRef}
              onStructuredChange={(p)=>{ setStructured(p); if (p?.name) setFieldErrors(e=>({...e, name: undefined})); if (p?.description) setFieldErrors(e=>({...e, description: undefined})); }}
              className="rounded-lg overflow-hidden"
            />
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
    </section>
  );
} 