"use client";
import React, { useMemo, useState } from "react";
import { useTests } from "@/hooks/use-tests";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ProjectBadge } from "@/components/ui/project-badge";
import { PersonaBadge } from "@/components/ui/persona-badge";
import { RowActionsDropdown } from "./row-actions-dropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface TableTest {
  _id: string;
  name: string;
  description?: string;
  project?: { _id: string; name: string } | null;
  persona?: { _id: string; name: string } | null;
  successfulRuns?: number;
  failedRuns?: number;
  createdBy?: { name: string; role: string } | null;
  updatedAt?: string;
}

export function TestsTable() {
  const testsHook = useTests();
  const { tests, testsLoading, moveTestToTrash, deleteTest, duplicateTest } = testsHook;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const limit = 25;

  const columns = useMemo<ColumnDef<TableTest>[]>(
    () => [
      {
        accessorKey: "name",
        header: () => "Name",
        cell: ({ row }) => {
          const t = row.original;
          return (
            <span className="font-medium truncate" title={t.description || t.name}>{t.name}</span>
          );
        },
      },
      {
        id: "project",
        header: () => "Project",
        cell: ({ row }) => {
          const proj = row.original.project;
          return proj ? <ProjectBadge name={proj.name} /> : "-";
        },
      },
      {
        id: "persona",
        header: () => "Persona",
        cell: ({ row }) => {
          const p = row.original.persona;
          return p ? <PersonaBadge name={p.name} /> : "-";
        },
      },
      {
        id: "runs",
        header: () => "Runs",
        cell: ({ row }) => {
          const { successfulRuns = 0, failedRuns = 0 } = row.original;
          return (
            <span className="flex items-center gap-1">
              <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                ✓ {successfulRuns}
              </Badge>
              <Badge variant="secondary" className="px-1.5 py-0 text-xs bg-red-500/10 text-red-700 dark:text-red-400">
                ✗ {failedRuns}
              </Badge>
            </span>
          );
        },
      },
      {
        id: "createdBy",
        header: () => "Created By",
        cell: ({ row }) => {
          const c = row.original.createdBy;
          if (!c) return "-";
          const initials = c.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
          return (
            <span className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src="" alt={c.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[120px]" title={c.name}>{c.name}</span>
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <RowActionsDropdown
            testId={row.original._id}
            onOpen={() => {}}
            actions={{ moveTestToTrash, deleteTest, duplicateTest }}
          />
        ),
      },
    ],
    []
  );

  const dataArray = (tests || []) as unknown as TableTest[];
  const table = useReactTable({
    data: dataArray,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const router = useRouter();

  // Pagination controls - naive client-side page slice
  const total = tests?.length || 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const pageRows = table.getRowModel().rows.slice((page - 1) * limit, page * limit);

  return (
    <section className="w-full overflow-x-auto">
      {/* Table */}
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id} className="text-left px-3 py-2 font-semibold">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {testsLoading ? (
            <tr><td colSpan={columns.length} className="p-4 text-center">Loading…</td></tr>
          ) : pageRows.length === 0 ? (
            <tr><td colSpan={columns.length} className="p-4 text-center text-muted-foreground">No tests found</td></tr>
          ) : (
            pageRows.map(row => {
              const handleRowClick: React.MouseEventHandler<HTMLTableRowElement> = (e) => {
                if ((e.target as HTMLElement).closest('[data-stop-row]')) return;
                router.push(`/tests/${row.original._id}`);
              };
              return (
                <tr key={row.id} onClick={handleRowClick} className={cn("border-b last:border-b-0 cursor-pointer hover:bg-muted/60") }>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2 whitespace-nowrap max-w-[12rem]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 mt-2">
          <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">Page {page} of {pageCount}</span>
          <Button variant="outline" size="icon" disabled={page === pageCount} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </section>
  );
} 