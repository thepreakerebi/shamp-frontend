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
import { useTests } from "@/hooks/use-tests";
import { ChevronsUpDown, Check } from "lucide-react";

interface TestCommandProps {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

export default function TestCommand({ value, onChange, error }: TestCommandProps) {
  const { tests } = useTests();
  const [open, setOpen] = useState(false);
  const selected = tests?.find(t => t._id === value);

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            {selected ? selected.name : "Select test"}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search test..." className="h-9" />
            <CommandList>
              <CommandEmpty>No test found.</CommandEmpty>
              {tests?.map(t => (
                <CommandItem
                  key={t._id}
                  value={t.name}
                  onSelect={() => {
                    onChange(t._id);
                    setOpen(false);
                  }}
                >
                  {t.name}
                  <Check className={`ml-auto size-4 ${value === t._id ? "opacity-100" : "opacity-0"}`} />
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