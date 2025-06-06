import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Notifications() {
  // In a real app, fetch notification count and list here
  const unreadCount = 0;
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="relative flex items-center justify-center p-2 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 bg-destructive text-white px-1 py-0.5 text-xs" variant="destructive">
          {unreadCount}
        </Badge>
      )}
    </button>
  );
} 