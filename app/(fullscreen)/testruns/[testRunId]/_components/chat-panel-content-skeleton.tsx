import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPanelContentSkeleton() {
  return (
    <aside className="flex flex-col h-full overflow-hidden border-l animate-pulse">
      {/* Header */}
      <header className="p-4 border-b">
        <Skeleton className="h-4 w-32" />
      </header>

      {/* Messages */}
      <section className="flex-1 overflow-auto p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
        ))}
      </section>

      {/* Input */}
      <footer className="border-t p-4">
        <Skeleton className="h-10 w-full rounded-full" />
      </footer>
    </aside>
  );
} 