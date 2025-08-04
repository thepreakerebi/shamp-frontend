"use client";
import React, { useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PendingFile {
  file: File;
  previewUrl?: string; // for future image preview
}

interface FileUploaderProps {
  files: PendingFile[];
  setFiles: (files: PendingFile[]) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  'text/plain','text/csv','application/json','application/xml','text/xml','text/html','text/markdown',
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

export default function FileUploader({ files, setFiles, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement|null>(null);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>)=>{
    const list = e.target.files;
    if(!list) return;
    const arr: PendingFile[] = [];
    Array.from(list).forEach(f=>{
      if(!ALLOWED_TYPES.includes(f.type)) return;
      if(f.size>10*1024*1024) return; // 10 MB cap
      arr.push({file:f});
    });
    if(arr.length) setFiles([...files, ...arr]);
    e.target.value=""; // reset
  },[files,setFiles]);

  const onDrop = useCallback((e: React.DragEvent)=>{
    e.preventDefault();
    if(disabled) return;
    const list = e.dataTransfer.files;
    const arr: PendingFile[] = [];
    Array.from(list).forEach(f=>{
      if(!ALLOWED_TYPES.includes(f.type)) return;
      if(f.size>10*1024*1024) return;
      arr.push({file:f});
    });
    if(arr.length) setFiles([...files, ...arr]);
  },[files,setFiles,disabled]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Attachments (optional)</label>
      <p className="text-xs text-muted-foreground mb-2">Add files for personas to use during the test run (e.g., CSV, images).</p>
      <div
        className={cn("w-full border-dashed border-2 rounded-md p-4 text-center text-sm cursor-pointer hover:bg-muted transition-colors", disabled && "opacity-50 cursor-not-allowed")}
        onClick={()=>{ if(inputRef.current && !disabled) inputRef.current.click(); }}
        onDragOver={e=>{e.preventDefault();}}
        onDrop={onDrop}
      >
        Drag & drop files here, or <span className="underline">browse</span>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={onSelect} disabled={disabled} />
      </div>
      {files.length>0 && (
        <ul className="mt-2 space-y-1 max-h-40 overflow-auto">
          {files.map((p,i)=>(
            <li key={i} className="flex items-center justify-between text-sm border rounded px-2 py-1">
              <span className="truncate mr-2">{p.file.name}</span>
              <button type="button" onClick={()=>{
                const copy=[...files]; copy.splice(i,1); setFiles(copy);
              }} className="text-muted-foreground hover:text-foreground"><X className="size-4"/></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
