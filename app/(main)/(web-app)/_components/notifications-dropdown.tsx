"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { CustomDropdownMenuSeparator } from "@/components/ui/custom-dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dot } from "lucide-react";
import type { Notification as Notif } from "@/lib/store/notifications";
import { Trash } from "lucide-react";

export default function NotificationsDropdown() {
  const notifHook = useNotifications();
  const {
    notifications,
    notificationsLoading,
    markAllAsRead,
    clearAll,
  } = notifHook;

  // Tab filter state
  const [tab, setTab] = useState<"all" | "unread">("all");

  // Unread count
  const unreadCount = useMemo(
    () => notifications?.filter((n) => !n.read).length ?? 0,
    [notifications],
  );

  const filtered: Notif[] = useMemo(() => {
    if (!notifications) return [];
    if (tab === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, tab]);

  // No workspace switching needed.

  return (
    <aside className="flex flex-col gap-2 w-[400px] max-h-[600px] text-sm">
      {/* <CustomDropdownMenuSeparator /> */}

      {/* Tabs + Actions */}
      <header className="flex items-center justify-between p-2 pt-3 gap-4">
        <nav className="flex gap-2">
          <Button
            variant={tab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("all")}
          >
            All
          </Button>
          <Button
            variant={tab === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("unread")}
          >
            Unread {unreadCount ? <Badge className="ml-1" variant="secondary">{unreadCount}</Badge> : null}
          </Button>
        </nav>

        <section className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={unreadCount === 0}
            onClick={markAllAsRead}
          >
            Mark all read
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!notifications || notifications.length === 0}
            onClick={clearAll}
          >
            <Trash className="size-4" />
            <span className="sr-only">Clear</span>
          </Button>
        </section>
      </header>

      <CustomDropdownMenuSeparator />

      {/* Notifications list */}
      <main className="flex-1 min-h-[150px]">
        {notificationsLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : filtered && filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No notifications</p>
        ) : (
          <ScrollArea className="h-[45vh] pr-2">
            <ul className="flex flex-col">
              {filtered!.map((n) => (
                <NotificationRow key={n._id} notification={n} />
              ))}
            </ul>
          </ScrollArea>
        )}
      </main>
    </aside>
  );
}

// -- Internal notification row component --
interface NotificationRowProps {
  notification: Notif;
}

function NotificationRow({ notification }: NotificationRowProps) {
  const router = useRouter();
  const { markNotificationAsRead } = useNotifications({ enabled: false });

  // Create click handler based on type
  const handleClick = () => {
    let path: string | null = null;
    switch (notification.type) {
      case "testRunStopped": {
        const id = (notification.data as any).testRunId as string | undefined;
        if (id) {
          window.open(`/testruns/${id}`, "_blank");
        }
        break;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      case "batchTestCompleted": {
        const id = (notification.data as any).batchTestId as string | undefined;
        if (id) path = `/tests/batch/${id}?tab=runs`;
        break;
      }
      case "scheduleRunUpcoming": {
        // Navigate to schedules tab
        path = "/tests?tab=schedules";
        break;
      }
      default:
        break;
    }
    if (path) {
      router.push(path);
    }

    // Mark as read (optimistic + backend sync)
    markNotificationAsRead(notification._id);
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-start gap-3 w-full px-3 py-2 text-left hover:bg-muted",
          !notification.read && "bg-accent/20",
        )}
      >
        <NotificationAvatar notification={notification} />
        <article className="flex-1 space-y-1">
          <p className="text-sm leading-4">
            {renderNotificationText(notification)}
          </p>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </article>
        {!notification.read && <Dot className="size-4 text-destructive" />}
      </button>
    </li>
  );
}

function NotificationAvatar({ notification }: { notification: NotificationRowProps["notification"] }) {
  const type = notification.type;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = notification.data as any;
  if (type === "testRunStopped" || type === "scheduleRunUpcoming") {
    if (data.personaAvatarUrl) {
      return (
        <Avatar className="size-8">
          <AvatarImage src={data.personaAvatarUrl} alt={data.personaName || "avatar"} />
          <AvatarFallback>{(data.personaName || "").charAt(0)}</AvatarFallback>
        </Avatar>
      );
    }
  }
  // default icon or fallback
  return (
    <Avatar className="size-8 bg-muted">
      <AvatarFallback>
        {type === "batchTestCompleted" ? "B" : "T"}
      </AvatarFallback>
    </Avatar>
  );
}

function renderNotificationText(notification: NotificationRowProps["notification"]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { type, data } = notification as any;
  switch (type) {
    case "testRunStopped": {
      const { testName, personaName, status } = data;
      return (
        <span>
          Test run <strong>{testName}</strong> for {personaName ? <strong>{personaName}</strong> : "persona"} stopped with status <strong>{status}</strong>.
        </span>
      );
    }
    case "batchTestCompleted": {
      const { testName, batchPersonaName, status } = data;
      return (
        <span>
          Batch test <strong>{testName}</strong> ({batchPersonaName}) completed with status <strong>{status}</strong>.
        </span>
      );
    }
    case "scheduleRunUpcoming": {
      const { testName, personaName, runTime } = data;
      return (
        <span>
          Scheduled run for <strong>{testName}</strong> {personaName && `(${personaName})`} coming up at {new Date(runTime).toLocaleString()}.
        </span>
      );
    }
    default:
      return <span>Unknown notification</span>;
  }
} 