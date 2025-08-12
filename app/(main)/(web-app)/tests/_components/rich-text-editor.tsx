"use client";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, type PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import "./rich-text-editor.css";

export type RichTextEditorHandle = {
  getPlainText: () => string;
  getBlocks: () => BlockNode[];
  getHasValidGoal: () => boolean;
};

interface RichTextEditorProps {
  className?: string;
  onPlainTextChange?: (text: string) => void;
  invalid?: boolean;
  initialBlocks?: unknown[];
}

// Very lightweight plain-text extraction from BlockNote document blocks
type InlineNode = { type?: string; text?: string; content?: InlineNode[] } | string;
type BlockNode = {
  type?: string;
  content?: InlineNode[];
  children?: BlockNode[];
};

const DEFAULT_GOAL_HINT = "One concise sentence describing exactly what should be achieved.";
const DEFAULT_TEMPLATE_LINES = new Set<string>([
  DEFAULT_GOAL_HINT,
  "Open the page and…",
  "Click … and fill …",
  "Submit and verify …",
  "What confirms the task is done (e.g., dashboard visible)",
  "Stop immediately once success is confirmed",
  "If blocked after at most 2 retries, stop and summarize why",
  "Optional negative paths worth checking (if any)",
  // Headings: excluded from serialization
  "Goal",
  "Steps",
  "Success criteria",
  "Stop conditions",
  "Edge cases",
]);

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
      if (type?.includes("heading")) {
        // skip headings
      } else if (type === "bulletListItem" || type === "numberedListItem" || type === "checkboxItem") {
        if (text && !DEFAULT_TEMPLATE_LINES.has(text.trim())) {
          lines.push(`- ${text}`.trim());
        }
      } else if (text) {
        if (!DEFAULT_TEMPLATE_LINES.has(text.trim())) {
          lines.push(text.trim());
        }
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
      { type: "text", text: DEFAULT_GOAL_HINT },
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
  ({ className, onPlainTextChange, initialBlocks }, ref) => {
    // Restrict blocks: no Code Block, Media, or Advanced
    const textOnlySchema = BlockNoteSchema.create({
      blockSpecs: {
        paragraph: defaultBlockSpecs.paragraph,
        heading: defaultBlockSpecs.heading,
        bulletListItem: defaultBlockSpecs.bulletListItem,
        numberedListItem: defaultBlockSpecs.numberedListItem,
        // keep checklists out for now to simplify the schema
      },
      inlineContentSpecs: defaultInlineContentSpecs,
    });

    // Initialize editor with restricted schema
    // Prefer provided initialBlocks if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = useCreateBlockNote({ initialContent: (Array.isArray(initialBlocks) && initialBlocks.length ? (initialBlocks as any) : (DEFAULT_TEMPLATE as any)), schema: textOnlySchema });
    const lastPlainTextRef = useRef<string>("");

    useImperativeHandle(
      ref,
      () => ({
        getPlainText: () => blocksToPlainText(editor.document as BlockNode[]),
        getBlocks: () => editor.document as BlockNode[],
        getHasValidGoal: () => {
          const blocks = editor.document as BlockNode[];
          const isHeading = (b: BlockNode) => (b.type ?? "").includes("heading");
          const getText = (b: BlockNode) => (Array.isArray(b.content) ? (b.content as InlineNode[]).map((n)=> typeof n === 'string' ? n : (n.text ?? '')).join("").trim() : '');
          let goalIdx = -1;
          for (let i=0;i<blocks.length;i++){
            const b = blocks[i];
            if (isHeading(b) && getText(b).toLowerCase() === 'goal') { goalIdx = i; break; }
          }
          if (goalIdx === -1) return false;
          for (let i=goalIdx+1;i<blocks.length;i++){
            const b = blocks[i];
            if (isHeading(b)) break;
            const t = getText(b);
            if (t && t !== DEFAULT_GOAL_HINT) return true;
          }
          return false;
        },
      }),
      [editor]
    );

    const wrapperClass = [
      className,
      "rte-surface border border-border rounded-lg overflow-hidden pt-3",
    ].filter(Boolean).join(" ");

    return (
      <section
        className={wrapperClass}
        onKeyDown={(e) => {
          // Allow new lines in editor without triggering form submit
          if (e.key === 'Enter' || e.key === 'Return') {
            e.stopPropagation();
          }
        }}
      >
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
      </section>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;


