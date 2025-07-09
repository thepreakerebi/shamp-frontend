import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageSkeletonProps {
  className?: string;
  variant?: "default" | "workspace-switching";
}

export function PageSkeleton({ className, variant = "default" }: PageSkeletonProps) {
  return (
    <div suppressHydrationWarning className={cn("flex h-screen w-full bg-background", className)}>
      {/* Workspace switching indicator */}
      {variant === "workspace-switching" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-primary font-medium">Switching workspace...</span>
          </div>
        </div>
      )}
      
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex md:w-64 lg:w-72 flex-col border-r bg-card/50">
        {/* Sidebar Header */}
        <div className="flex flex-col gap-4 border-b p-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex flex-col gap-1 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          
          {/* Workspace switcher */}
          <Skeleton className={cn("h-4 w-28", variant === "workspace-switching" && "animate-pulse")} />
          
          {/* Create button */}
          <Skeleton className="h-9 w-full rounded-md" />
          
          {/* Search */}
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
        
        {/* Sidebar Navigation */}
        <div className="flex-1 p-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 mb-3" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Sidebar Footer */}
        <div className="border-t p-4 space-y-2">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-8 w-16 mt-2" />
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header (visible on small screens) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card/50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 p-4 space-y-4">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
          
          {/* Content Grid/Cards */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 bg-card/50">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <div className="space-y-1 text-center">
                  <Skeleton className="h-4 w-20 mx-auto" />
                  <Skeleton className="h-3 w-24 mx-auto" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Section Divider */}
          <div className="flex items-center gap-2 my-6">
            <div className="flex-1 border-b" />
            <Skeleton className="h-4 w-16" />
            <div className="flex-1 border-b" />
          </div>
          
          {/* List Content */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-2 mt-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 