import { Home, ListChecks, PlayCircle, Settings, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Notifications } from "./notifications";
import { ThemeSwitcher } from "./theme-switcher";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";

const items = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "Tests",
    url: "/tests",
    icon: ListChecks,
  },
  {
    title: "Test Runs",
    url: "/test-runs",
    icon: PlayCircle,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

function getInitials(firstName?: string, lastName?: string, email?: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

export function AppSidebar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader className="gap-4 border-b pb-4 mb-2">
        {/* User info and notifications */}
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-3">
            {loading ? (
              <Skeleton className="size-8 rounded-full" />
            ) : (
              <Avatar>
                {user?.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.firstName || user.email || 'User'} />
                ) : (
                  <AvatarFallback>
                    {getInitials(user?.firstName, user?.lastName, user?.email)}
                  </AvatarFallback>
                )}
              </Avatar>
            )}
            <div className="flex flex-col min-w-0">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </>
              ) : (
                <>
                  <span className="font-medium text-sm truncate">
                    {user?.firstName || ''} {user?.lastName || ''}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </>
              )}
            </div>
          </div>
          {loading ? <Skeleton className="size-8 rounded-full" /> : <Notifications />}
        </div>
        {/* Search input */}
        <div className="mt-3">
          {loading ? <Skeleton className="h-8 w-full rounded-md" /> : <SidebarInput placeholder="Search..." />}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} prefetch={false}>
                        <item.icon className={cn(!isActive && "text-muted-foreground")} />
                        <span className={cn(!isActive && "text-muted-foreground")}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto flex flex-col gap-2 border-t pt-4">
        <ThemeSwitcher />
        <button
          type="button"
          aria-label="Logout"
          onClick={logout}
          className={cn(sidebarMenuButtonVariants({ variant: "default", size: "default" }), "w-full flex items-center gap-2 justify-start")}
        >
          <LogOut className="size-5 mr-2" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
} 