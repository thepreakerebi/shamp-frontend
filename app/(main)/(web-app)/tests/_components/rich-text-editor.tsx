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

    // Merge provided initial blocks with template: keep existing sections' content,
    // and fill any missing sections with template heading + placeholder content.
    const mergeWithTemplate = (blocks: unknown[]): PartialBlock[] => {
      const tmpl = DEFAULT_TEMPLATE as unknown as PartialBlock[];
      const getText = (b: unknown): string => {
        const content = (b as { content?: InlineNode[] })?.content;
        if (!Array.isArray(content)) return "";
        return content
          .map((n) => (typeof n === "string" ? n : (n?.text as string) ?? ""))
          .join("")
          .trim();
      };
      const isHeading = (b: unknown) => (b as { type?: string })?.type?.includes("heading");

      const src = Array.isArray(blocks) ? (blocks as PartialBlock[]) : [];

      const findSection = (name: string) => {
        for (let i = 0; i < src.length; i++) {
          const b = src[i] as unknown;
          if (isHeading(b) && getText(b).toLowerCase() === name.toLowerCase()) {
            // gather subsequent non-heading blocks until next heading
            const collected: PartialBlock[] = [src[i]];
            for (let j = i + 1; j < src.length; j++) {
              const nb = src[j] as unknown;
              if (isHeading(nb)) break;
              collected.push(src[j]);
            }
            return collected;
          }
        }
        return null;
      };

      const sectionNames = [
        "Goal",
        "Steps",
        "Success criteria",
        "Stop conditions",
        "Edge cases",
      ];

      const out: PartialBlock[] = [];
      for (const name of sectionNames) {
        const found = findSection(name);
        if (found && found.length) {
          out.push(...found);
          // ensure at least one content block after heading
          if (found.length === 1) {
            // locate default content for this heading from template
            const defIdx = tmpl.findIndex((b) => isHeading(b) && getText(b).toLowerCase() === name.toLowerCase());
            if (defIdx !== -1) {
              for (let k = defIdx + 1; k < tmpl.length; k++) {
                const tb = tmpl[k];
                if (isHeading(tb)) break;
                out.push(tb);
                break; // only one placeholder item by default
              }
            }
          }
        } else {
          // inject template heading + its default content
          const defIdx = tmpl.findIndex((b) => isHeading(b) && getText(b).toLowerCase() === name.toLowerCase());
          if (defIdx !== -1) {
            out.push(tmpl[defIdx]);
            for (let k = defIdx + 1; k < tmpl.length; k++) {
              const tb = tmpl[k];
              if (isHeading(tb)) break;
              out.push(tb);
            }
          }
        }
      }

      return out as PartialBlock[];
    };

    const normalizedInitial = React.useMemo(() => {
      if (Array.isArray(initialBlocks) && initialBlocks.length) {
        return mergeWithTemplate(initialBlocks as unknown[]);
      }
      return DEFAULT_TEMPLATE as unknown as PartialBlock[];
    }, [initialBlocks]);

    // If the initialBlocks change after mount, reset the editor's document in place
    React.useEffect(() => {
      try {
        if (Array.isArray(initialBlocks) && initialBlocks.length) {
          const merged = mergeWithTemplate(initialBlocks as unknown[]);
          const e = editor as unknown as { replaceDocument?: (doc: PartialBlock[]) => void };
          if (e && typeof e.replaceDocument === 'function') {
            e.replaceDocument(merged as PartialBlock[]);
          }
        }
      } catch {}
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialBlocks]);

    // Initialize editor with restricted schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = useCreateBlockNote({ initialContent: normalizedInitial as any, schema: textOnlySchema });
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
          }}
          // Steer visual styles through scoped CSS class
        />
      </section>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;


