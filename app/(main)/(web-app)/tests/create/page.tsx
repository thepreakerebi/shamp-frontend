"use client";
import React from "react";
import { useTests } from "@/hooks/use-tests";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import RichTextEditor, { RichTextEditorHandle } from "../_components/rich-text-editor";

export default function CreateTestPage() {
  const { createTest } = useTests();
  const router = useRouter();
  const editorRef = React.useRef<RichTextEditorHandle | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      type BlockLike = { type?: string; props?: Record<string, unknown> };
      const blocks = (editorRef.current?.getBlocks() as unknown[] as BlockLike[]) || [];
      const description = editorRef.current?.getPlainText() || "";
      let name = "";
      let persona = "";
      let project = "";
      let device: string | undefined;
      let files: { fileName: string; contentType: string; data: string }[] = [];

      for (const b of blocks) {
        if (!b || typeof b !== "object") continue;
        switch (b.type) {
          case "nameBlock":
            name = (b.props?.value as string) || "";
            break;
          case "personaBlock":
            persona = (b.props?.personaId as string) || "";
            break;
          case "projectBlock":
            project = (b.props?.projectId as string) || "";
            break;
          case "deviceBlock":
            device = (b.props?.device as string) || undefined;
            break;
          case "attachmentsBlock": {
            try {
              const parsed = JSON.parse((b.props?.filesJson as string) || "[]");
              if (Array.isArray(parsed)) files = parsed;
            } catch {}
            break;
          }
        }
      }

      const viewportMap: Record<string, { w: number; h: number }> = {
        desktop: { w: 1280, h: 720 },
        tablet: { w: 820, h: 1180 },
        mobile: { w: 360, h: 800 },
      };
      const vp = device ? viewportMap[device as keyof typeof viewportMap] || viewportMap.desktop : viewportMap.desktop;

      const newTest = await createTest({
        name,
        description,
        project,
        persona,
        browserViewportWidth: vp.w,
        browserViewportHeight: vp.h,
        ...(files.length ? { files } : {}),
      });
      toast.success("Test created");
      if (newTest && newTest._id) {
        router.push(`/tests/${newTest._id}`);
      } else {
      router.push("/tests");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create test");
    }
  };

  return (
    <main className="p-4 w-full max-w-[650px] mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Create Test</h1>
      <form onSubmit={handleSubmit} id="create-test-form">
        <RichTextEditor ref={editorRef} />
      </form>
    </main>
  );
} 