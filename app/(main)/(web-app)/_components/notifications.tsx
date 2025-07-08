import { Bell } from "lucide-react";
// Removed numeric badge; using dot indicator instead
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
            <span
              className="absolute top-1 right-0.5 block h-2 w-2 rounded-full bg-destructive"
            >
              <span className="sr-only">New notifications</span>
            </span>
          )}
        </button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end" className="p-0 w-auto">
        <NotificationsDropdown />
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 