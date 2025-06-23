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
import { useBatchPersonas } from "@/hooks/use-batch-personas";
import { ChevronsUpDown, Check } from "lucide-react";
import Image from "next/image";
import type { BatchPersona } from "@/hooks/use-batch-personas";

interface BatchPersonaCommandProps {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export default function BatchPersonaCommand({ value, onChange, error }: BatchPersonaCommandProps) {
  const { batchPersonas } = useBatchPersonas();
  const [open, setOpen] = useState(false);
  const selected = batchPersonas?.find(p => p._id === value);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            {selected ? selected.name : "Select batch persona"}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search batch persona..." className="h-9" />
            <CommandList>
              <CommandEmpty>No batch persona found.</CommandEmpty>
              {batchPersonas?.map((p: BatchPersona) => (
                <CommandItem
                  key={p._id}
                  value={p.name}
                  onSelect={() => {
                    onChange(p._id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    {/* Show up to four avatars or fallback */}
                    {Array.isArray(p.personas) && p.personas.length > 0 ? (
                      <div className="flex -space-x-1">
                        {(p.personas as { avatarUrl?: string }[]).slice(0, 4).map((per, idx: number) => (
                          <Image
                            key={idx}
                            src={per.avatarUrl || "/placeholder.png"}
                            alt="avatar"
                            width={20}
                            height={20}
                            className="rounded-full object-cover border"
                            unoptimized
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="w-6 h-6 rounded-full flex items-center justify-center bg-muted text-[10px] font-medium text-muted-foreground border">
                        {p.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{Array.isArray(p.personas) ? p.personas.length : 0} personas</span>
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