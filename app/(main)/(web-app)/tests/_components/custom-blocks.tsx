"use client";
import { createReactBlockSpec } from "@blocknote/react";
import { Input } from "@/components/ui/input";
import PersonaCommand from "../create/_components/persona-command";
import ProjectCommand from "../create/_components/project-command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Laptop, Tablet, Smartphone } from "lucide-react";
import React from "react";

export const NameBlock = createReactBlockSpec(
  {
    type: "nameBlock",
    content: "none",
    propSchema: { value: { default: "" } },
  },
  {
    render: (props) => {
      return (
        <section className="space-y-1">
          <label className="block text-sm font-medium">Name</label>
          <Input
            value={(props.block.props as { value?: string }).value || ""}
            onChange={(e) =>
              props.editor.updateBlock(props.block, {
                type: "nameBlock",
                props: { value: e.target.value },
              })
            }
          />
        </section>
      );
    },
  }
);

export const PersonaBlock = createReactBlockSpec(
  {
    type: "personaBlock",
    content: "none",
    propSchema: { personaId: { default: "" } },
  },
  {
    render: (props) => {
      const personaId = (props.block.props as { personaId?: string }).personaId || "";
      return (
        <section className="space-y-1">
          <label className="block text-sm font-medium">Persona</label>
          <PersonaCommand
            value={personaId}
            onChange={(id) =>
              props.editor.updateBlock(props.block, {
                type: "personaBlock",
                props: { personaId: id },
              })
            }
          />
        </section>
      );
    },
  }
);

export const ProjectBlock = createReactBlockSpec(
  {
    type: "projectBlock",
    content: "none",
    propSchema: { projectId: { default: "" } },
  },
  {
    render: (props) => {
      const projectId = (props.block.props as { projectId?: string }).projectId || "";
      return (
        <section className="space-y-1">
          <label className="block text-sm font-medium">Project</label>
          <ProjectCommand
            value={projectId}
            onChange={(id) =>
              props.editor.updateBlock(props.block, {
                type: "projectBlock",
                props: { projectId: id },
              })
            }
          />
        </section>
      );
    },
  }
);

export const DeviceBlock = createReactBlockSpec(
  {
    type: "deviceBlock",
    content: "none",
    propSchema: { device: { default: "" } },
  },
  {
    render: (props) => {
      const device = (props.block.props as { device?: string }).device || "";
      return (
        <section className="space-y-1">
          <label className="block text-sm font-medium">Device type</label>
          <RadioGroup
            value={device}
            onValueChange={(v) =>
              props.editor.updateBlock(props.block, {
                type: "deviceBlock",
                props: { device: v },
              })
            }
            className="grid grid-cols-3 gap-2 max-w-xs"
          >
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
        </section>
      );
    },
  }
);

export type AttachmentPayload = { fileName: string; contentType: string; data: string };

export const AttachmentsBlock = createReactBlockSpec(
  {
    type: "attachmentsBlock",
    content: "none",
    // Store as JSON string because propSchema only supports primitives
    propSchema: { filesJson: { default: "[]" } },
  },
  {
    render: (props) => {
      const filesJson = (props.block.props as { filesJson?: string }).filesJson || "[]";
      let filesCount = 0;
      try {
        const arr = JSON.parse(filesJson) as AttachmentPayload[];
        filesCount = Array.isArray(arr) ? arr.length : 0;
      } catch {
        filesCount = 0;
      }

      const readFileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const idx = result.indexOf(",");
            resolve(idx >= 0 ? result.slice(idx + 1) : result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const handleChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const list = e.target.files;
        if (!list) return;
        const payloads: AttachmentPayload[] = [];
        for (let i = 0; i < list.length; i++) {
          const f = list.item(i)!;
          const data = await readFileToBase64(f);
          payloads.push({ fileName: f.name, contentType: f.type, data });
        }
        props.editor.updateBlock(props.block, {
          type: "attachmentsBlock",
          props: { filesJson: JSON.stringify(payloads) },
        });
        // Clear the input so the same file selection can re-trigger change if needed
        e.currentTarget.value = "";
      };

      return (
        <section className="space-y-1">
          <label className="block text-sm font-medium">Attachments (optional)</label>
          <input type="file" multiple onChange={handleChange} className="block text-sm" />
          {filesCount > 0 && (
            <p className="text-xs text-muted-foreground">{filesCount} file(s) attached</p>
          )}
        </section>
      );
    },
  }
);


