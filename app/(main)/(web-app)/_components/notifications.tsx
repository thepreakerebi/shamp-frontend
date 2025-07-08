import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
} from "@/components/ui/custom-dropdown-menu";
import NotificationsDropdown from "./notifications-dropdown";

export function Notifications() {
  const {
    notifications,
    notificationsLoading,
    hasWorkspaceContext,
  } = useNotifications();

  // Compute unread count once notifications have loaded.
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  // Hide the button entirely when there is no workspace context to avoid confusing UX.
  if (!hasWorkspaceContext) {
    return null;
  }

  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex items-center justify-center p-2 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Bell className="size-4" />
          {!notificationsLoading && unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 bg-destructive text-white px-1 py-0.5 text-xs"
              variant="destructive"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end" className="p-0 w-auto">
        <NotificationsDropdown />
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 