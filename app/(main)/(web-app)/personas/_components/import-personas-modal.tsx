"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropZoneArea,
  DropzoneTrigger,
  DropzoneDescription,
  DropzoneMessage,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneRemoveFile,
  DropzoneRetryFile,
  InfiniteProgress,
  useDropzone,
} from "@/components/ui/dropzone";
import { usePersonas } from "@/hooks/use-personas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadCloud, FileText, X, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Persona } from "@/hooks/use-personas";

/**
 * Context + provider to control the Import Personas modal from anywhere *inside* the web-app.
 */
const ImportPersonasModalContext = React.createContext<{
  open: boolean;
  setOpen: (o: boolean) => void;
} | null>(null);

export function useImportPersonasModal() {
  const ctx = React.useContext(ImportPersonasModalContext);
  if (!ctx) throw new Error("useImportPersonasModal must be used within ImportPersonasModalProvider");
  return ctx;
}

export function ImportPersonasModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <ImportPersonasModalContext.Provider value={{ open, setOpen }}>
      {children}
      <ImportPersonasModal />
    </ImportPersonasModalContext.Provider>
  );
}

/** UI statuses for the modal */
type Stage = "select" | "uploading" | "preview";

function ImportPersonasModal() {
  const { open, setOpen } = useImportPersonasModal();
  const { uploadPersonaDocument } = usePersonas();

  const [stage, setStage] = React.useState<Stage>("select");
  const [uploadResult, setUploadResult] = React.useState<{
    created: Persona[];
    errors: unknown[];
  } | null>(null);

  // Reset internal state when modal is opened/closed
  React.useEffect(() => {
    if (!open) {
      setStage("select");
      setUploadResult(null);
    }
  }, [open]);

  /**
   * Dropzone setup
   */
  const dz = useDropzone<{ created: Persona[]; errors: unknown[] }, string>({
    onDropFile: async (file) => {
      try {
        setStage("uploading");
        const res = await uploadPersonaDocument(file);
        setUploadResult(res);
        setStage("preview");
        return { status: "success", result: res } as const;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        return { status: "error", error: message } as const;
      }
    },
    validation: {
      accept: {
        "application/pdf": [".pdf"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "text/csv": [".csv"],
      },
      maxSize: 5 * 1024 * 1024,
      maxFiles: 1,
    },
  });

  const handleConfirm = () => {
    if (uploadResult && uploadResult.created.length > 0) {
      toast.success(`${uploadResult.created.length} personas imported`);
    } else {
      toast.warning("No personas created from file");
    }
    setOpen(false);
  };

  const isUploading = stage === "uploading";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Import personas from file</DialogTitle>
          <DialogDescription>Upload a PDF, Word or CSV and extract personas automatically.</DialogDescription>
        </DialogHeader>

        {stage === "select" && (
          <>
            <Dropzone {...dz}>
              <DropZoneArea className="h-40 flex flex-col items-center justify-center gap-2 text-center">
                <UploadCloud className="size-6" />
                <p className="text-sm">
                  Drag & drop a PDF, Word or CSV here, or <DropzoneTrigger className="underline text-secondary-foreground">browse</DropzoneTrigger>
                </p>
                <DropzoneDescription>Max 5 MB, 1 file</DropzoneDescription>
              </DropZoneArea>

              <DropzoneMessage className="pt-1" />

              <DropzoneFileList className="mt-4">
                {dz.fileStatuses.map((file) => (
                  <DropzoneFileListItem key={file.id} file={file}>
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0" />
                      <span className="flex-1 truncate text-sm">{file.fileName}</span>
                      {file.status !== "pending" && (
                        <InfiniteProgress status={file.status} className="w-24" />
                      )}
                      {file.status === "error" && (
                        <DropzoneRetryFile size="icon">
                          <RotateCcw className="size-4" />
                        </DropzoneRetryFile>
                      )}
                      <DropzoneRemoveFile size="icon">
                        <X className="size-4" />
                      </DropzoneRemoveFile>
                    </div>
                  </DropzoneFileListItem>
                ))}
              </DropzoneFileList>
            </Dropzone>
          </>
        )}

        {isUploading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="size-6 animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading & parsing file, please wait…</p>
          </div>
        )}

        {stage === "preview" && uploadResult && (
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4">
              <p className="text-sm font-medium">
                {uploadResult.created.length} personas detected
                {uploadResult.errors.length > 0 && (
                  <span className="text-destructive"> • {uploadResult.errors.length} errors</span>
                )}
              </p>
              <ul className="max-h-60 overflow-y-auto">
                {uploadResult.created.slice(0, 10).map((p: Persona) => (
                  <li key={p._id} className="text-sm">
                    <span className="font-medium">{p.name}</span> – {p.description}
                  </li>
                ))}
                {uploadResult.created.length > 10 && (
                  <li className="text-xs italic">…and {uploadResult.created.length - 10} more</li>
                )}
              </ul>
              {uploadResult.errors.length > 0 && (
                <details className="text-xs text-destructive/80">
                  <summary className="cursor-pointer">View errors</summary>
                  <ul className="pl-4 list-disc">
                    {uploadResult.errors.map((e: unknown, i: number) => (
                      <li key={i}>{typeof e === "string" ? e : JSON.stringify(e)}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          {stage === "preview" ? (
            <>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleConfirm}>Done</Button>
            </>
          ) : (
            <DialogClose asChild>
              <Button variant="outline" disabled={isUploading}>Close</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 