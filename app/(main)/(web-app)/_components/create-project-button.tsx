"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateProjectButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full flex items-center gap-2 justify-start"
      onClick={() => router.push("/home/create")}
    >
      <Plus className="size-4" />
      <span>Create project</span>
    </Button>
  );
} 