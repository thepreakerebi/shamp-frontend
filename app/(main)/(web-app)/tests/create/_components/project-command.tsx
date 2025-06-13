"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { useProjects } from "@/hooks/use-projects";
import { ChevronsUpDown, Check } from "lucide-react";

interface ProjectCommandProps {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export default function ProjectCommand({ value, onChange, error }: ProjectCommandProps) {
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const selected = projects?.find(p => p._id === value);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            {selected ? selected.name : "Select project"}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search project..." className="h-9" />
            <CommandList>
              <CommandEmpty>No project found.</CommandEmpty>
              {projects?.map(p => (
                <CommandItem
                  key={p._id}
                  value={p.name}
                  onSelect={() => {
                    onChange(p._id);
                    setOpen(false);
                  }}
                >
                  {p.name}
                  <Check className={`ml-auto size-4 ${value === p._id ? "opacity-100" : "opacity-0"}`} />
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
} 