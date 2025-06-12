"use client";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface ToolbarProps<T> {
  table: Table<T>;
}

export function TestsTableToolbar<T>({ table }: ToolbarProps<T>) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      table.setGlobalFilter(query);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, table]);

  const selected = table.getSelectedRowModel().rows.length;

  return (
    <section className="flex items-center justify-between gap-2 mb-2">
      <Input
        placeholder="Search tests…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />
      <div className="flex items-center gap-2">
        {selected > 0 && <span className="text-sm mr-2">{selected} selected</span>}
      </div>
    </section>
  );
} 