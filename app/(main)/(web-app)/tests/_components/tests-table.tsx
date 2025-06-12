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
  getFilteredRowModel,
} from "@tanstack/react-table";
import { ProjectBadge } from "@/components/ui/project-badge";
import { PersonaBadge } from "@/components/ui/persona-badge";
import { RowActionsDropdown } from "./row-actions-dropdown";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { TestsTableToolbar } from "./tests-table-toolbar";
import { useAuth } from "@/lib/auth";

interface TableTest {
  _id: string;
  name: string;
  description?: string;
  project?: { _id: string; name: string } | null;
  persona?: { _id: string; name: string } | null;
  successfulRuns?: number;
  failedRuns?: number;
  createdBy?: { _id?: string; name: string; role: string } | null;
  updatedAt?: string;
}

export function TestsTable() {
  const testsHook = useTests();
  const { tests, testsLoading, moveTestToTrash, deleteTest, duplicateTest } = testsHook;
  const { user } = useAuth();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const limit = 25;

  const columns = useMemo<ColumnDef<TableTest>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const t = row.original;
          return (
            <span className="font-medium truncate" title={t.description || t.name}>{t.name}</span>
          );
        },
      },
      {
        id: "project",
        accessorFn: (row: TableTest) => row.project?.name ?? "",
        header: ({ column }) => <SortableHeader column={column} title="Project" />,
        cell: ({ row }) => {
          const proj = row.original.project;
          return proj ? <ProjectBadge name={proj.name} /> : "-";
        },
      },
      {
        id: "persona",
        accessorFn: (row: TableTest) => row.persona?.name ?? "",
        header: ({ column }) => <SortableHeader column={column} title="Persona" />,
        cell: ({ row }) => {
          const p = row.original.persona;
          return p ? <PersonaBadge name={p.name} /> : "-";
        },
      },
      {
        id: "runs",
        accessorFn: (row: TableTest) => (row.successfulRuns ?? 0) + (row.failedRuns ?? 0),
        header: ({ column }) => <SortableHeader column={column} title="Runs" />,
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
        accessorFn: (row: TableTest) => row.createdBy?.name ?? "",
        header: ({ column }) => <SortableHeader column={column} title="Created By" />,
        cell: ({ row }) => {
          const c = row.original.createdBy;
          if (!c) return "-";
          const isMe = user && (c._id ? c._id === user._id : c.name === `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
          const displayName = isMe ? "You" : c.name;
          return (
            <span className="truncate max-w-[150px]" title={displayName}>{displayName}</span>
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
    getFilteredRowModel: getFilteredRowModel(),
  });

  const router = useRouter();

  // Pagination controls - naive client-side page slice
  const total = tests?.length || 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const pageRows = table.getRowModel().rows.slice((page - 1) * limit, page * limit);

  return (
    <section className="w-full overflow-x-auto">
      <TestsTableToolbar table={table} />

      {/* Table */}
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id} className="text-left px-3 py-2 font-semibold select-none">
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

// Reusable sortable header component
function SortableHeader({ column, title }: { column: Column<TableTest, unknown>; title: string }) {
  const isSorted = column.getIsSorted() as false | 'asc' | 'desc';
  return (
    <button
      type="button"
      className="flex items-center gap-1"
      onClick={() => column.toggleSorting()}
    >
      {title}
      {isSorted ? (
        isSorted === 'asc' ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ChevronsUpDown className="w-3 h-3 text-muted-foreground" />
      )}
    </button>
  );
} 