import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface Props {
  personaOptions: string[];
  testNameOptions?: string[];
  filters: {
    result: string;
    run: string;
    persona: string;
    testName: string;
  };
  onChange: (f: Props["filters"]) => void;
}

export default function TestRunsFilter({ personaOptions, testNameOptions, filters, onChange }: Props) {
  const handle = (field: keyof Props["filters"], value: string) => {
    onChange({ ...filters, [field]: value });
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1"><Filter className="w-4 h-4"/> Filters</Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="space-y-4">
          {/* Result status */}
          <div>
            <p className="text-sm font-medium mb-1">Result status</p>
            <Select value={filters.result} onValueChange={v => handle("result", v)}>
              <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Run status */}
          <div>
            <p className="text-sm font-medium mb-1">Run status</p>
            <Select value={filters.run} onValueChange={v => handle("run", v)}>
              <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                {/* <SelectItem value="finished">Finished</SelectItem> */}
                {/* <SelectItem value="stopped">Stopped</SelectItem> */}
              </SelectContent>
            </Select>
          </div>
          {/* Test Name */}
          {testNameOptions && testNameOptions.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Test</p>
              <Select value={filters.testName} onValueChange={v => handle("testName", v)}>
                <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">All tests</SelectItem>
                  {testNameOptions.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Persona */}
          <div>
            <p className="text-sm font-medium mb-1">Persona</p>
            <Select value={filters.persona} onValueChange={v => handle("persona", v)}>
              <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All personas</SelectItem>
                {personaOptions.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Reset button */}
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={filters.result==='any' && filters.run==='any' && filters.persona==='any' && filters.testName==='any'}
              onClick={()=> onChange({ result:'any', run:'any', persona:'any', testName:'any' })}
            >
              Reset
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 