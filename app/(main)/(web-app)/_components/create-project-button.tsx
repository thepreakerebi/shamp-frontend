"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateProjectModal } from "./create-project-modal";

export function CreateProjectButton() {
  const { setOpen } = useCreateProjectModal();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full flex items-center gap-2 justify-start"
      onClick={() => setOpen(true)}
    >
      <Plus className="size-4" />
      <span>Create project</span>
    </Button>
  );
} 