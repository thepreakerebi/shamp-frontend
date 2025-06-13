"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function TestsTableSkeleton({ rows = 10 }: { rows?: number }) {
  const headers = ["Name", "Project", "Persona", "Runs", "Created By", ""];
  return (
    <section className="w-full overflow-x-auto" aria-label="Tests table skeleton">
      <div className="max-h-[84vh] overflow-y-auto relative">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left px-3 py-2 font-semibold select-none">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b last:border-b-0">
                {headers.map((_, idx) => (
                  <td key={idx} className="px-3 py-2 whitespace-nowrap max-w-[12rem]">
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
} 