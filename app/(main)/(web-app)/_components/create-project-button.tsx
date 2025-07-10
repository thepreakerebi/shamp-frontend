"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

// Rename original component to internal content component
function CreateProjectButtonContent() {
  const router = useRouter();

  const handleClick = async () => {
    // For now, simply navigate to the project creation flow. The backend
    // will enforce any billing limits via the existing billing middleware.
    router.push("/home/create");
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full flex items-center gap-2 justify-start"
      onClick={handleClick}
    >
      <Plus className="size-4" />
      <span>Create project</span>
    </Button>
  );
}

// Public component
export function CreateProjectButton() {
  return <CreateProjectButtonContent />;
} 