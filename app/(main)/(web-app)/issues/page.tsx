"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useIssues } from "@/hooks/use-issues";
import { IssueCard } from "./_components/issue-card";
import { IssueCardSkeleton } from "./_components/issue-card-skeleton";
import { IssuesListEmpty } from "./_components/issues-list-empty";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export default function IssuesPage() {
  const { issues: storeIssues } = useIssues();
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Simple logic: stop loading when we get data from the store
  useEffect(() => {
    if (storeIssues !== null) {
      setLoading(false);
    }
  }, [storeIssues]);

  const getColumnCount = useCallback(() => {
    if (!containerRef.current) return 1;
    const width = containerRef.current.offsetWidth;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    if (width >= 640) return 2;
    return 1;
  }, []);

  const layoutMasonry = useCallback(() => {
    if (!containerRef.current) return;

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
  }, [getColumnCount]);

  useEffect(() => {
    if (!containerRef.current) return;

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
  }, [storeIssues, loading, layoutMasonry]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      setTimeout(layoutMasonry, 50);
    });

    // Observe container width changes (sidebar collapse/expand)
    observer.observe(containerRef.current);

    // Observe individual items for height changes
    const items = containerRef.current.querySelectorAll('.masonry-item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [storeIssues, layoutMasonry, loading]);

  // LOADING STATE: Show skeletons
  if (loading) {
    return (
      <section className="p-4 space-y-4">
        <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
          <h1 className="text-2xl font-semibold">Issues</h1>
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Filter className="size-4" /> Filter
          </Button>
        </section>

        <div 
          ref={containerRef}
          className="relative w-full"
          style={{ height: containerHeight || 'auto' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <IssueCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // NOT LOADING + NO DATA: Show empty state
  if (!storeIssues || storeIssues.length === 0) {
    return (
      <section className="p-4 space-y-4">
        <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
          <h1 className="text-2xl font-semibold">Issues · 0</h1>
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Filter className="size-4" /> Filter
          </Button>
        </section>
        <IssuesListEmpty />
      </section>
    );
  }

  // NOT LOADING + HAS DATA: Show actual cards
  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h1 className="text-2xl font-semibold">Issues · {storeIssues.length}</h1>
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <Filter className="size-4" /> Filter
        </Button>
      </section>

      <div 
        ref={containerRef}
        className="relative w-full"
        style={{ height: containerHeight || 'auto' }}
      >
        {storeIssues.map((issue) => (
          <div key={issue._id ?? issue.createdAt} className="masonry-item">
            <IssueCard issue={issue} />
          </div>
        ))}
      </div>
    </section>
  );
} 