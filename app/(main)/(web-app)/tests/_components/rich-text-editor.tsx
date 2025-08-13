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

const DEFAULT_GOAL_HINT = "Enter goal here";

const PLACEHOLDERS: Record<string, string> = {
  Goal: "Enter goal here",
  Steps: "Enter steps here",
  "Success criteria": "Enter success criteria here",
  "Stop conditions": "Enter stop conditions here",
  "Edge cases": "Enter edge cases here",
};

const PLACEHOLDER_SET = new Set<string>(Object.values(PLACEHOLDERS));

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
        if (text && !PLACEHOLDER_SET.has(text.trim())) {
          lines.push(`- ${text}`.trim());
        }
      } else if (text) {
        if (!PLACEHOLDER_SET.has(text.trim())) {
          lines.push(text.trim());
        }
      }
      if (Array.isArray(b.children) && b.children.length) walk(b.children as BlockNode[]);
    }
  };

  walk((blocks || []) as BlockNode[]);
  return lines.join("\n").trim();
}

// Sanitize blocks for saving: remove placeholder-only and empty paragraphs
function sanitizeBlocksForSave(blocks: unknown[]): unknown[] {
  const isHeading = (b: unknown) => ((b as { type?: string })?.type ?? '').includes('heading');
  const readInline = (content: unknown): string => {
    if (!Array.isArray(content)) return '';
    return (content as unknown[])
      .map((n) => {
        if (!n) return '';
        if (typeof n === 'string') return n as string;
        const maybe = n as { text?: string; content?: unknown[]; type?: string };
        if (typeof maybe.text === 'string') return maybe.text;
        if (Array.isArray(maybe.content)) return readInline(maybe.content);
        return '';
      })
      .join('');
  };
  const out: unknown[] = [];
  for (const raw of (Array.isArray(blocks) ? blocks : []) as unknown[]) {
    if (isHeading(raw)) {
      out.push(raw);
      continue;
    }
    const text = readInline((raw as { content?: unknown }).content).trim();
    if (!text) continue; // drop empty
    if (PLACEHOLDER_SET.has(text)) continue; // drop placeholders
    // keep
    out.push(raw);
  }
  return out;
}

// Provide default section headings with placeholders and spacing for better UX
const DEFAULT_INITIAL: PartialBlock[] = [
  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Goal" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Goal"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Steps" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Steps"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Success criteria" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Success criteria"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Stop conditions" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Stop conditions"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Edge cases" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Edge cases"] }] },
  { type: "paragraph", content: [] },
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

    const normalizedInitial = React.useMemo(() => {
      if (Array.isArray(initialBlocks) && initialBlocks.length) {
        return initialBlocks as unknown as PartialBlock[];
      }
      // Start with headings, placeholders, and spacing
      return DEFAULT_INITIAL as unknown as PartialBlock[];
    }, [initialBlocks]);

    // Initialize editor with restricted schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = useCreateBlockNote({ initialContent: normalizedInitial as any, schema: textOnlySchema });
    const lastPlainTextRef = useRef<string>("");

    useImperativeHandle(
      ref,
      () => ({
        getPlainText: () => blocksToPlainText(editor.document as BlockNode[]),
        getBlocks: () => sanitizeBlocksForSave(editor.document as unknown[]) as unknown as BlockNode[],
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
      "rte-surface border border-border rounded-lg overflow-hidden pt-3 min-h-[480px]",
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
            // Remove placeholder text from blocks as soon as user starts typing beyond it
            try {
              type BN = { type?: string; content?: unknown; children?: unknown[] };
              const blocks = editor.document as unknown as BN[];
              const extract = (content: unknown): string => {
                if (!Array.isArray(content)) return "";
                return content
                  .map((n: unknown) => (typeof n === 'string' ? n : (n as { text?: string })?.text ?? ''))
                  .join("");
              };
              let mutated = false;
              const clone: BN[] = (blocks as unknown[]).map((b) => {
                const bb = b as BN;
                const nextContent = Array.isArray(bb.content) ? [...(bb.content as unknown[])] : bb.content;
                return { ...bb, content: nextContent };
              });
              for (let i = 0; i < clone.length; i++) {
                const b = clone[i];
                const type = (b?.type ?? '') as string;
                if (type.includes('heading')) continue;
                const text = extract(b?.content).trim();
                if (!text) continue;
                if (PLACEHOLDER_SET.has(text)) continue;
                for (const ph of PLACEHOLDER_SET) {
                  if (text.includes(ph)) {
                    const cleaned = text.replace(ph, '').trimStart();
                    (b as { content?: unknown }).content = cleaned ? ([{ type: 'text', text: cleaned }] as unknown) : ([] as unknown);
                    mutated = true;
                    break;
                  }
                }
              }
              if (mutated) {
                const e = editor as unknown as { replaceDocument?: (doc: PartialBlock[]) => void };
                if (e && typeof e.replaceDocument === 'function') {
                  e.replaceDocument(clone as unknown as PartialBlock[]);
                }
              }
            } catch {}
          }}
          // Steer visual styles through scoped CSS class
        />
      </section>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;


