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
import { usePersonas } from "@/hooks/use-personas";
import { ChevronsUpDown, Check } from "lucide-react";
import Image from "next/image";
import type { Persona } from "@/hooks/use-personas";

interface PersonaCommandProps {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export default function PersonaCommand({ value, onChange, error }: PersonaCommandProps) {
  const { personas } = usePersonas();
  const [open, setOpen] = useState(false);
  const selected = personas?.find(p => p._id === value);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            {selected ? selected.name : "Select persona"}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search persona..." className="h-9" />
            <CommandList>
              <CommandEmpty>No persona found.</CommandEmpty>
              {personas?.map((p: Persona) => (
                <CommandItem
                  key={p._id}
                  value={p.name}
                  onSelect={() => {
                    onChange(p._id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    {p.avatarUrl ? (
                      <Image src={p.avatarUrl} alt={p.name} width={24} height={24} className="rounded-full object-cover border" unoptimized />
                    ) : (
                      <span className="w-6 h-6 rounded-full flex items-center justify-center bg-muted text-[10px] font-medium text-muted-foreground border">
                        {p.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{p.name}</span>
                      {p.description && (
                        <span className="text-xs text-muted-foreground line-clamp-2">{p.description}</span>
                      )}
                    </div>
                  </div>
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