"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CreateTestButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full flex items-center gap-2 justify-start"
      onClick={() => router.push("/tests/create")}
    >
      <Plus className="size-4" />
      <span>Create test</span>
    </Button>
  );
} 