"use client";
import React, { useCallback, useRef, useState } from "react";
import { X, FileText, FileImage } from "lucide-react";
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

const MAX_PER_FILE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL = 50 * 1024 * 1024; // 50MB

const ALLOWED_TYPES = [
  'text/plain','text/csv','application/json','application/xml','text/xml','text/html','text/markdown',
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

export default function FileUploader({ files, setFiles, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement|null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>)=>{
    const list = e.target.files;
    if(!list) return;
    const arr: PendingFile[] = [];
    let totalSize = files.reduce((s,p)=>s+p.file.size,0);
    Array.from(list).forEach(f=>{
      if(!ALLOWED_TYPES.includes(f.type)) { setErrorMsg(`${f.name}: unsupported file type`); return; }
      if(f.size>MAX_PER_FILE) { setErrorMsg(`${f.name}: exceeds 10 MB limit`); return; }
      if(totalSize + f.size > MAX_TOTAL){ setErrorMsg(`Total attachment size cannot exceed 50 MB`); return; }
      arr.push({file:f});
      totalSize += f.size;
    });
    if(arr.length){ setFiles([...files, ...arr]); setErrorMsg(null);}
    e.target.value=""; // reset
  },[files,setFiles]);

  const onDrop = useCallback((e: React.DragEvent)=>{
    e.preventDefault();
    if(disabled) return;
    const list = e.dataTransfer.files;
    const arr: PendingFile[] = [];
    let totalSize = files.reduce((s,p)=>s+p.file.size,0);
    Array.from(list).forEach(f=>{
      if(!ALLOWED_TYPES.includes(f.type)) { setErrorMsg(`${f.name}: unsupported file type`); return; }
      if(f.size>MAX_PER_FILE) { setErrorMsg(`${f.name}: exceeds 10 MB limit`); return; }
      if(totalSize + f.size > MAX_TOTAL){ setErrorMsg(`Total attachment size cannot exceed 50 MB`); return; }
      arr.push({file:f});
      totalSize += f.size;
    });
    if(arr.length){ setFiles([...files, ...arr]); setErrorMsg(null);}
  },[files,setFiles,disabled]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Attachments (optional)</label>
      <p className="text-xs text-muted-foreground mb-2">Add files for personas to use during the test run (e.g. .txt, .csv, .json, .xml, .html, .md, .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .jpeg, .png, .gif, .webp).</p>
      <div
        className={cn("w-full border-dashed border-2 rounded-md p-4 text-center text-sm cursor-pointer hover:bg-muted transition-colors", disabled && "opacity-50 cursor-not-allowed")}
        onClick={()=>{ if(inputRef.current && !disabled) inputRef.current.click(); }}
        onDragOver={e=>{e.preventDefault();}}
        onDrop={onDrop}
      >
        Drag & drop files here, or <span className="underline">browse</span>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={onSelect} disabled={disabled} />
      </div>
      {errorMsg && (<p className="text-destructive text-xs mt-1">{errorMsg}</p>)}
      {files.length>0 && (
        <ul className="mt-2 space-y-1 max-h-40 overflow-auto">
          {files.map((p,i)=>{
            const isImage = p.file.type.startsWith('image/');
            const Icon = isImage ? FileImage : FileText;
            return (
            <li key={i} className="flex items-center justify-between text-sm border rounded px-2 py-1">
              <span className="flex items-center gap-1 truncate mr-2"><Icon className="size-4 shrink-0" /> {p.file.name}</span>
              <button type="button" onClick={()=>{
                const copy=[...files]; copy.splice(i,1); setFiles(copy);
              }} className="text-muted-foreground hover:text-foreground"><X className="size-4"/></button>
            </li>
          )})}
        </ul>
      )}
    </div>
  );
}
