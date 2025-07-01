"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useIssues } from "@/hooks/use-issues";
import { IssueCard } from "./_components/issue-card";
import { IssuesListEmpty } from "./_components/issues-list-empty";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function IssuesPage() {
  const { issues: storeIssues } = useIssues();
  const [issues, setIssues] = useState(storeIssues);
  const [loading, setLoading] = useState(storeIssues ? false : true);
  const [initialDone, setInitialDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Sync state from store
  useEffect(() => {
    setIssues(storeIssues ?? null);
    if (!initialDone) {
      setLoading(false);
      setInitialDone(true);
    }
  }, [storeIssues, initialDone]);

  const getColumnCount = useCallback(() => {
    if (!containerRef.current) return 1;
    const width = containerRef.current.offsetWidth;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    if (width >= 640) return 2;
    return 1;
  }, []);

  const layoutMasonry = useCallback(() => {
    if (!containerRef.current || !issues?.length) return;

    const container = containerRef.current;
    const items = container.querySelectorAll('.masonry-item') as NodeListOf<HTMLElement>;
    const columnCount = getColumnCount();
    const gap = 16;
    const columnWidth = (container.offsetWidth - (gap * (columnCount - 1))) / columnCount;

    // Initialize column heights
    const columnHeights = new Array(columnCount).fill(0);

    items.forEach((item) => {
      // Find shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      
      // Position the item
      const x = shortestColumnIndex * (columnWidth + gap);
      const y = columnHeights[shortestColumnIndex];

      item.style.position = 'absolute';
      item.style.left = `${x}px`;
      item.style.top = `${y}px`;
      item.style.width = `${columnWidth}px`;

      // Update column height
      columnHeights[shortestColumnIndex] += item.offsetHeight + gap;
    });

    // Set container height to the tallest column
    const maxHeight = Math.max(...columnHeights) - gap;
    setContainerHeight(maxHeight);
  }, [issues, getColumnCount]);

  useEffect(() => {
    if (!initialDone || loading || !issues?.length) return;

    // Layout after a short delay to ensure content is rendered
    const timer = setTimeout(() => {
      layoutMasonry();
    }, 150);

    const handleResize = () => {
      setTimeout(layoutMasonry, 50);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [issues, initialDone, loading, layoutMasonry]);

  // Re-layout when content changes
  useEffect(() => {
    if (!containerRef.current || !issues?.length) return;

    const observer = new ResizeObserver(() => {
      setTimeout(layoutMasonry, 50);
    });

    const items = containerRef.current.querySelectorAll('.masonry-item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [issues, layoutMasonry]);

  if ((!initialDone && loading) || (loading && (issues === null || issues.length === 0))) {
    return (
      <section className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (initialDone && !loading && (issues === null || issues.length === 0)) {
    return <IssuesListEmpty />;
  }

  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h1 className="text-2xl font-semibold">Issues · {(issues ?? []).length}</h1>
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <Filter className="size-4" /> Filter
        </Button>
      </section>

      <div 
        ref={containerRef}
        className="relative w-full"
        style={{ height: containerHeight || 'auto' }}
      >
        {(issues ?? []).map((issue) => (
          <div key={issue._id ?? issue.createdAt} className="masonry-item">
            <IssueCard issue={issue} />
          </div>
        ))}
      </div>
    </section>
  );
} 