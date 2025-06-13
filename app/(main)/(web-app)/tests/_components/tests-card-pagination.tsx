"use client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

export function TestsCardPagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange:(p:number)=>void }) {
  if (pageCount <= 1) return null;
  return (
    <Pagination className="py-2 mt-4">
      <PaginationContent>
        <PaginationPrevious
          aria-disabled={page === 1}
          onClick={() => page > 1 && onPageChange(page-1)}
        />
        <PaginationItem>
          <span className="px-2 text-sm select-none">Page {page} of {pageCount}</span>
        </PaginationItem>
        <PaginationNext
          aria-disabled={page === pageCount}
          onClick={() => page < pageCount && onPageChange(page+1)}
        />
      </PaginationContent>
    </Pagination>
  );
} 