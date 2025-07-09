import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, Users, Upload, User, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateDropdownButtonProps {
  onSinglePersona?: () => void;
  onBatchPersonas?: () => void;
  onImportFile?: () => void;
}

export function CreateDropdownButton({ onSinglePersona, onBatchPersonas, onImportFile }: CreateDropdownButtonProps) {
  const router = useRouter();
  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" /> Create <ChevronDown className="size-4" />
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent>
        <CustomDropdownMenuItem onSelect={() => {
          if (onSinglePersona) onSinglePersona();
          router.push('/personas/create');
        }}>
          <User className="size-4 mr-2" /> Single persona
        </CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={() => {
          if (onBatchPersonas) onBatchPersonas();
        }}>
          <Users className="size-4 mr-2" /> Batch personas
        </CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={() => {
          if (onImportFile) onImportFile();
        }}>
          <Upload className="size-4 mr-2" /> Import file
        </CustomDropdownMenuItem>
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 