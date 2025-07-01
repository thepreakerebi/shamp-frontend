"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SidebarInput } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SearchItem {
  _id: string;
  name: string;
  type: "test" | "project" | "persona" | "batchpersona";
}

function SearchInput({ query, setQuery, onClear }: { query: string; setQuery: (v: string) => void; onClear: () => void }) {
  return (
    <div className="relative">
      <SidebarInput
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pr-8"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function SidebarSearchDropdown() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { token } = useAuth();

  // Debounced fetch
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setDropdownOpen(false);
        return;
      }
      if (!token) {
        setResults([]);
        setDropdownOpen(false);
        return;
      }
      setLoading(true);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
        const res = await fetch(`${API_BASE}/search/names?q=${encodeURIComponent(query)}&limit=8`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        const toItems = (arr: unknown[] | undefined, type: SearchItem["type"]): SearchItem[] => {
          if (!Array.isArray(arr)) return [];
          return arr
            .filter((o): o is { _id: string; name: string } =>
              typeof o === "object" && o !== null && "_id" in o && "name" in o
            )
            .map(({ _id, name }) => ({ _id: String(_id), name: String(name), type }));
        };

        const flat: SearchItem[] = [
          ...toItems(data.tests, "test"),
          ...toItems(data.projects, "project"),
          ...toItems(data.personas, "persona"),
          ...toItems(data.batchpersonas, "batchpersona"),
        ];
        setResults(flat);
        setDropdownOpen(flat.length > 0);
      } catch (err) {
        console.error(err);
        setResults([]);
        setDropdownOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const goto = useCallback(
    (item: SearchItem) => {
      switch (item.type) {
        case "test":
          router.push(`/tests/${item._id}`);
          break;
        case "project":
          router.push(`/home/${item._id}`);
          break;
        case "persona":
          router.push(`/personas/${item._id}`);
          break;
        case "batchpersona":
          router.push(`/personas/batch/${item._id}`);
          break;
      }
    },
    [router]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchInput 
        query={query} 
        setQuery={setQuery} 
        onClear={() => {
          setQuery("");
          setDropdownOpen(false);
        }} 
      />
      {dropdownOpen && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-2 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground">No results</div>
          )}
          {!loading &&
            results.map((item: SearchItem) => (
              <div
                key={`${item.type}-${item._id}`}
                onClick={() => {
                  goto(item);
                  setDropdownOpen(false);
                }}
                className="cursor-pointer p-2 hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium truncate">{item.name}</span>
                  <Badge variant="secondary" className="w-max text-xs capitalize">
                    {item.type === "batchpersona" ? "batch persona" : item.type}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
} 