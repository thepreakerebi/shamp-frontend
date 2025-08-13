"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, type PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
// Reuse the same CSS surface styles as tests rich text editor
import "../../tests/_components/rich-text-editor.css";

// Lightweight BlockNote node types used locally
type InlineNode = { type?: string; text?: string; content?: InlineNode[] } | string;
type BlockNode = { type?: string; content?: InlineNode[]; children?: BlockNode[]; props?: Record<string, unknown> };

export type PersonaStructured = {
  name: string;
  description: string;
  background?: string;
  gender?: "Male" | "Female" | "Prefer not to say";
  goals?: string[];
  frustrations?: string[];
  traits?: string[];
  preferredDevices?: ("Desktop" | "Tablet" | "Mobile")[];
};

export type PersonaRichTextEditorHandle = {
  getBlocks: () => BlockNode[];
  getStructuredPersona: () => PersonaStructured | null;
  getHasValidBasics: () => boolean; // name + description present
};

interface PersonaRichTextEditorProps {
  className?: string;
  initialBlocks?: unknown[];
  onStructuredChange?: (p: PersonaStructured | null) => void;
}

// Placeholders for first content paragraph under each heading
const PLACEHOLDERS: Record<string, string> = {
  Name: "Enter name here",
  Description: "Enter description here",
  Background: "Enter background here",
  Gender: "Enter gender here (Male, Female, Prefer not to say)",
  Goals: "Enter goals here",
  Frustrations: "Enter frustrations here",
  Traits: "Enter traits here",
  "Preferred devices": "Enter preferred devices here (Desktop, Tablet, Mobile)",
};
const PLACEHOLDER_SET = new Set<string>(Object.values(PLACEHOLDERS));

// Default initial content: headings + placeholder + one extra spacer paragraph
const DEFAULT_INITIAL: PartialBlock[] = [
  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Name" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Name"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Description" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Description"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Background" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Background"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Gender" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Gender"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Goals" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Goals"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Frustrations" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Frustrations"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Traits" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Traits"] }] },
  { type: "paragraph", content: [] },

  { type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Preferred devices" }] },
  { type: "paragraph", content: [{ type: "text", text: PLACEHOLDERS["Preferred devices"] }] },
  { type: "paragraph", content: [] },
] as unknown as PartialBlock[];

// Utilities
const titleCase = (v: string): string => v
  .toLowerCase()
  .replace(/\p{L}+/gu, w => w.charAt(0).toUpperCase() + w.slice(1));

const readInline = (content: unknown): string => {
  if (!Array.isArray(content)) return "";
  return (content as unknown[])
    .map((n) => {
      if (!n) return "";
      if (typeof n === "string") return n as string;
      const maybe = n as { text?: string; content?: unknown[]; type?: string };
      if (typeof maybe.text === "string") return maybe.text;
      if (Array.isArray(maybe.content)) return readInline(maybe.content);
      return "";
    })
    .join("");
};

const isHeading = (b: unknown): boolean => ((b as { type?: string })?.type ?? '').includes('heading');

// Sanitize for saving: drop placeholder-only/empty, and drop headings without following content
function sanitizeBlocksForSave(blocks: unknown[]): unknown[] {
  const src = Array.isArray(blocks) ? (blocks as unknown[]) : [];
  const prelim: unknown[] = [];
  for (const raw of src) {
    if (isHeading(raw)) { prelim.push(raw); continue; }
    const text = readInline((raw as { content?: unknown }).content).trim();
    if (!text) continue;
    if (PLACEHOLDER_SET.has(text)) continue;
    prelim.push(raw);
  }
  const kept: unknown[] = [];
  for (let i = 0; i < prelim.length; i++) {
    const b = prelim[i] as { type?: string; content?: unknown };
    if (!isHeading(b)) { kept.push(b); continue; }
    let hasContent = false;
    for (let j = i + 1; j < prelim.length; j++) {
      const nb = prelim[j] as { type?: string };
      if (isHeading(nb)) break;
      hasContent = true; break;
    }
    if (hasContent) kept.push(b);
  }
  return kept;
}

// Parse structured persona from blocks
function parseStructuredPersona(blocks: unknown[]): PersonaStructured | null {
  if (!Array.isArray(blocks)) return null;
  const pairs: Array<{ title: string; lines: string[] }> = [];
  const src = blocks as Array<{ type?: string; content?: unknown; props?: Record<string, unknown> }>;
  let i = 0;
  const lower = (s: string) => s.toLowerCase().trim();
  const pushPair = (title: string, lines: string[]) => {
    const cleaned = lines.map(l => l.trim()).filter(l => l && !PLACEHOLDER_SET.has(l));
    pairs.push({ title, lines: cleaned });
  };
  while (i < src.length) {
    const b = src[i];
    if (isHeading(b)) {
      const title = readInline(b.content).trim();
      const lines: string[] = [];
      i++;
      while (i < src.length && !isHeading(src[i])) {
        const t = readInline(src[i].content).trim();
        if (t) lines.push(t);
        i++;
      }
      pushPair(title, lines);
      continue;
    }
    i++;
  }
  // Map pairs into structured fields
  const get = (name: string) => pairs.find(p => lower(p.title) === lower(name));
  const firstLine = (name: string) => (get(name)?.lines?.[0] ?? '').trim();
  const multi = (name: string) => get(name)?.lines ?? [];

  const rawName = firstLine('Name');
  const rawDesc = firstLine('Description');
  if (!rawName || !rawDesc) return null;
  const structured: PersonaStructured = {
    name: titleCase(rawName),
    description: rawDesc,
  };
  const bg = firstLine('Background');
  if (bg) structured.background = bg;
  // Gender normalize
  const g = firstLine('Gender').toLowerCase();
  if (g.includes('male')) structured.gender = 'Male';
  else if (g.includes('female')) structured.gender = 'Female';
  else if (g.includes('prefer')) structured.gender = 'Prefer not to say';
  // Goals/Frustrations/Traits
  const goals = multi('Goals');
  if (goals.length) structured.goals = goals;
  const frs = multi('Frustrations');
  if (frs.length) structured.frustrations = frs;
  const trs = multi('Traits');
  if (trs.length) structured.traits = trs;
  // Preferred devices
  const devText = multi('Preferred devices').join(', ').toLowerCase();
  const devices: ("Desktop"|"Tablet"|"Mobile")[] = [];
  if (/(^|\W)desktop(\W|$)/.test(devText)) devices.push('Desktop');
  if (/(^|\W)tablet(\W|$)/.test(devText)) devices.push('Tablet');
  if (/(^|\W)mobile(\W|$)/.test(devText)) devices.push('Mobile');
  if (devices.length) structured.preferredDevices = Array.from(new Set(devices));
  return structured;
}

const PersonaRichTextEditor = forwardRef<PersonaRichTextEditorHandle, PersonaRichTextEditorProps>(
  ({ className, onStructuredChange, initialBlocks }, ref) => {
    // Restrict schema to headings, paragraphs, basic lists
    const schema = BlockNoteSchema.create({
      blockSpecs: {
        paragraph: defaultBlockSpecs.paragraph,
        heading: defaultBlockSpecs.heading,
        bulletListItem: defaultBlockSpecs.bulletListItem,
        numberedListItem: defaultBlockSpecs.numberedListItem,
      },
      inlineContentSpecs: defaultInlineContentSpecs,
    });

    const normalizedInitial = React.useMemo(() => {
      if (Array.isArray(initialBlocks) && initialBlocks.length) return initialBlocks as unknown as PartialBlock[];
      return DEFAULT_INITIAL as unknown as PartialBlock[];
    }, [initialBlocks]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = useCreateBlockNote({ initialContent: normalizedInitial as any, schema });
    const lastStructuredRef = useRef<string>("");

    useImperativeHandle(
      ref,
      () => ({
        getBlocks: () => sanitizeBlocksForSave(editor.document as unknown[]) as unknown as BlockNode[],
        getStructuredPersona: () => parseStructuredPersona(sanitizeBlocksForSave(editor.document as unknown[])) as PersonaStructured | null,
        getHasValidBasics: () => {
          const s = parseStructuredPersona(sanitizeBlocksForSave(editor.document as unknown[]));
          return !!(s && s.name && s.description);
        },
      }),
      [editor]
    );

    const wrapperClass = [
      className,
      "rte-surface border border-border rounded-lg overflow-hidden pt-3 min-h-[480px]",
    ].filter(Boolean).join(" ");

    return (
      <section className={wrapperClass}>
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={() => {
            if (onStructuredChange) {
              try {
                const s = parseStructuredPersona(sanitizeBlocksForSave(editor.document as unknown[]));
                const sig = s ? JSON.stringify(s) : "";
                if (sig !== lastStructuredRef.current) {
                  lastStructuredRef.current = sig;
                  onStructuredChange(s);
                }
              } catch {}
            }
            // Remove placeholder fragments if user typed beyond them
            try {
              type BN = { type?: string; content?: unknown };
              const blocks = editor.document as unknown as BN[];
              const extract = (c: unknown): string => readInline(c);
              let mutated = false;
              const clone: BN[] = (blocks as unknown[]).map((b) => {
                const next = Array.isArray((b as BN).content) ? [ ...(b as { content?: unknown[] }).content as unknown[] ] : (b as BN).content;
                return { ...(b as BN), content: next };
              });
              for (let i = 0; i < clone.length; i++) {
                const b = clone[i];
                if (isHeading(b)) continue;
                const t = extract((b as BN).content).trim();
                if (!t) continue;
                if (PLACEHOLDER_SET.has(t)) continue;
                for (const ph of PLACEHOLDER_SET) {
                  if (t.includes(ph)) {
                    const cleaned = t.replace(ph, '').trimStart();
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
        />
      </section>
    );
  }
);

PersonaRichTextEditor.displayName = "PersonaRichTextEditor";

export default PersonaRichTextEditor;


