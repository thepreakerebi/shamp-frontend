"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateTestModal } from "./create-test-modal";

export function CreateTestButton() {
  const { setOpen } = useCreateTestModal();
  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      className="w-full flex items-center gap-2 justify-start"
      onClick={() => setOpen(true)}
    >
      <Plus className="size-4" />
      <span>Create test</span>
    </Button>
  );
} 