import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface Props {
  personaOptions: string[];
  filters: {
    persona: string;
    status: string;
  };
  onChange: (f: Props["filters"]) => void;
}

export default function IssuesFilter({ personaOptions, filters, onChange }: Props) {
  const handle = (field: keyof Props["filters"], value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="space-y-4">
          {/* Persona */}
          <div>
            <p className="text-sm font-medium mb-1">Persona</p>
            <Select value={filters.persona} onValueChange={v => handle("persona", v)}>
              <SelectTrigger className="w-full h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All personas</SelectItem>
                {personaOptions.map(persona => (
                  <SelectItem key={persona} value={persona}>{persona}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm font-medium mb-1">Status</p>
            <Select value={filters.status} onValueChange={v => handle("status", v)}>
              <SelectTrigger className="w-full h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 