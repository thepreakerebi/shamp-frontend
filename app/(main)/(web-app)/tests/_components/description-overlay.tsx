"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import RichTextEditor, { RichTextEditorHandle } from "./rich-text-editor";

interface DescriptionOverlayProps {
  open: boolean;
  onClose: () => void;
  onPlainTextChange: (text: string) => void;
}

export default function DescriptionOverlay({ open, onClose, onPlainTextChange }: DescriptionOverlayProps) {
  const editorRef = React.useRef<RichTextEditorHandle | null>(null);

  if (!open) return null;

  return (
    <section
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      style={{ left: "var(--sidebar-width, 16rem)" }}
      aria-modal
      role="dialog"
    >
      <section className="h-full w-full flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 bg-background">
          <h2 className="text-base font-medium">Enter description</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close description editor">
            <X className="size-5" />
          </Button>
        </header>
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <RichTextEditor
            ref={editorRef}
            onPlainTextChange={onPlainTextChange}
            className="w-full"
          />
        </div>
      </section>
    </section>
  );
}


