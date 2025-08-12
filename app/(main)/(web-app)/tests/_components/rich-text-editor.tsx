"use client";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "./rich-text-editor.css";

export type RichTextEditorHandle = {
  getPlainText: () => string;
  getBlocks: () => BlockNode[];
};

interface RichTextEditorProps {
  className?: string;
  onPlainTextChange?: (text: string) => void;
}

// Very lightweight plain-text extraction from BlockNote document blocks
type InlineNode = { type?: string; text?: string; content?: InlineNode[] } | string;
type BlockNode = {
  type?: string;
  content?: InlineNode[];
  children?: BlockNode[];
};

function blocksToPlainText(blocks: BlockNode[]): string {
  const lines: string[] = [];

  const extractInlineText = (inline: InlineNode[]): string => {
    return inline
      .map((n) => {
        if (!n) return "";
        if (typeof n === "string") return n;
        if (n.type === "text" && typeof n.text === "string") return n.text;
        if (n.type === "link" && Array.isArray(n.content)) return extractInlineText(n.content);
        if (Array.isArray(n.content)) return extractInlineText(n.content);
        return "";
      })
      .join("");
  };

  const walk = (bs: BlockNode[]) => {
    for (const b of bs) {
      if (!b) continue;
      const type = b.type as string | undefined;
      const text = Array.isArray(b.content) ? extractInlineText(b.content as InlineNode[]) : "";
      if (type === "bulletListItem" || type === "numberedListItem" || type === "checkboxItem") {
        lines.push(`- ${text}`.trim());
      } else if (type?.includes("heading")) {
        lines.push(text.trim());
      } else if (text) {
        lines.push(text.trim());
      }
      if (Array.isArray(b.children) && b.children.length) walk(b.children as BlockNode[]);
    }
  };

  walk((blocks || []) as BlockNode[]);
  return lines.join("\n").trim();
}

const DEFAULT_TEMPLATE = [
  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Goal" }] },
  {
    type: "paragraph",
    content: [
      { type: "text", text: "One concise sentence describing exactly what should be achieved." },
    ],
  },
  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Steps" }] },
  { type: "numberedListItem", content: [{ type: "text", text: "Open the page and…" }] },
  { type: "numberedListItem", content: [{ type: "text", text: "Click … and fill …" }] },
  { type: "numberedListItem", content: [{ type: "text", text: "Submit and verify …" }] },
  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Success criteria" }] },
  { type: "bulletListItem", content: [{ type: "text", text: "What confirms the task is done (e.g., dashboard visible)" }] },
  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Stop conditions" }] },
  { type: "bulletListItem", content: [{ type: "text", text: "Stop immediately once success is confirmed" }] },
  { type: "bulletListItem", content: [{ type: "text", text: "If blocked after at most 2 retries, stop and summarize why" }] },
  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Edge cases" }] },
  { type: "bulletListItem", content: [{ type: "text", text: "Optional negative paths worth checking (if any)" }] },
] as unknown as PartialBlock[];

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ className, onPlainTextChange }, ref) => {
    const editor = useCreateBlockNote({ initialContent: DEFAULT_TEMPLATE });
    const lastPlainTextRef = useRef<string>("");

    useImperativeHandle(
      ref,
      () => ({
        getPlainText: () => blocksToPlainText(editor.document as BlockNode[]),
        getBlocks: () => editor.document as BlockNode[],
      }),
      [editor]
    );

    return (
      <div className={[className, "rte-surface"].filter(Boolean).join(" ") }>
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={() => {
            if (onPlainTextChange) {
              try {
                const text = blocksToPlainText(editor.document as BlockNode[]);
                if (text !== lastPlainTextRef.current) {
                  lastPlainTextRef.current = text;
                  onPlainTextChange(text);
                }
              } catch {}
            }
          }}
          // Steer visual styles through scoped CSS class
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;


