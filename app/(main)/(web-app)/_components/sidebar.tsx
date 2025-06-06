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
  const { user, logout } = useAuth();
  return (
    <Sidebar>
      <SidebarHeader className="gap-4 border-b pb-4 mb-2">
        {/* User info and notifications */}
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-3">
            <Avatar>
              {user?.profilePicture ? (
                <AvatarImage src={user.profilePicture} alt={user.firstName || user.email || 'User'} />
              ) : (
                <AvatarFallback>
                  {getInitials(user?.firstName, user?.lastName, user?.email)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {user?.firstName || ''} {user?.lastName || ''}
              </span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
          </div>
          <Notifications />
        </div>
        {/* Search input */}
        <div className="mt-3">
          <SidebarInput placeholder="Search..." />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} prefetch={false}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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