"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useIssues } from "@/hooks/use-issues";
import { IssueCard } from "./_components/issue-card";
import { IssueCardSkeleton } from "./_components/issue-card-skeleton";
import { IssuesListEmpty } from "./_components/issues-list-empty";
import IssuesFilter from "./_components/issues-filter";

export default function IssuesPage() {
  const { issues: storeIssues } = useIssues();
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [filters, setFilters] = useState({
    persona: "any",
    status: "any"
  });

  // Get unique persona names for filter options
  const personaOptions = useMemo(() => {
    if (!storeIssues) return [];
    const personas = [...new Set(storeIssues.map(issue => issue.personaName).filter(Boolean))];
    return personas.sort();
  }, [storeIssues]);

  // Filter issues based on selected filters
  const filteredIssues = useMemo(() => {
    if (!storeIssues) return null;
    
    return storeIssues.filter(issue => {
      // Filter by persona
      if (filters.persona !== "any" && issue.personaName !== filters.persona) {
        return false;
      }
      
      // Filter by status
      if (filters.status !== "any") {
        const isResolved = issue.resolved;
        if (filters.status === "resolved" && !isResolved) return false;
        if (filters.status === "unresolved" && isResolved) return false;
      }
      
      return true;
    });
  }, [storeIssues, filters]);

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
  }, [filteredIssues, loading, layoutMasonry]);

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
  }, [filteredIssues, layoutMasonry, loading]);

  // LOADING STATE: Show skeletons
  if (loading) {
    return (
      <section className="p-4 space-y-4">
        <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
          <h1 className="text-2xl font-semibold">Issues</h1>
        </section>

        <div 
          ref={containerRef}
          className="relative w-full"
          style={{ height: containerHeight || 'auto' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <IssueCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // NOT LOADING + NO DATA: Show empty state
  if (!filteredIssues || filteredIssues.length === 0) {
    return (
      <section className="p-4 space-y-4">
        <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
          <h1 className="text-2xl font-semibold">Issues · 0</h1>
          
        </section>
        <IssuesListEmpty />
      </section>
    );
  }

  // NOT LOADING + HAS DATA: Show actual cards
  return (
    <section className="p-4 space-y-4">
      <section className="sticky top-[60px] z-10 bg-background flex items-center justify-between gap-4 py-2">
        <h1 className="text-2xl font-semibold">Issues · {filteredIssues.length}</h1>
        <IssuesFilter
          personaOptions={personaOptions}
          filters={filters}
          onChange={setFilters}
        />
      </section>

      <div 
        ref={containerRef}
        className="relative w-full"
        style={{ height: containerHeight || 'auto' }}
      >
        {filteredIssues.map((issue) => (
          <div key={issue._id ?? issue.createdAt} className="masonry-item">
            <IssueCard issue={issue} />
          </div>
        ))}
      </div>
    </section>
  );
} 