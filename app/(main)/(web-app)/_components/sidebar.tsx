import { Home, ListChecks, PlayCircle, Settings, LogOut, Users, Trash2, Bug } from "lucide-react";
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
  sidebarMenuButtonVariants,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useAuth } from '@/lib/auth';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Notifications } from "./notifications";
import { ThemeSwitcher } from "./theme-switcher";
import { CreateTestButton } from "./create-test-button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { SidebarSearchDropdown } from "./sidebar-search";
import { WorkspaceSwitcher } from "./workspace-switcher";

const items = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "Personas",
    url: "/personas",
    icon: Users,
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
    title: "Issues",
    url: "/issues",
    icon: Bug,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Trash",
    url: "/trash",
    icon: Trash2,
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
        <section className="flex flex-row items-center justify-between gap-2">
          <section className="flex flex-row items-center gap-3">
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
            <section className="flex flex-col min-w-0">
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
            </section>
          </section>
          {loading ? <Skeleton className="size-8 rounded-full" /> : <Notifications />}
        </section>
        {/* Create buttons */}
        <section className="flex flex-col gap-2 mt-3">
          {loading ? (
            <Skeleton className="h-4 w-32 mb-2" />
          ) : (
            <WorkspaceSwitcher />
          )}
          <CreateTestButton />
          {/* <CreateProjectButton /> */}
        </section>
        {/* Search input */}
        <section className="mt-3">
          {loading ? <Skeleton className="h-8 w-full rounded-md" /> : <SidebarSearchDropdown />}
        </section>
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
                        <item.icon
                          className={cn(!isActive && "text-muted-foreground")}
                          strokeWidth={isActive ? 2.4 : 1.5}
                        />
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
        <section className="w-full flex px-2 mt-2">
          <Image
            src="/Shamp-logo-light.svg"
            alt="Shamp Logo"
            width={64}
            height={32}
            className="dark:hidden"
          />
          <Image
            src="/Shamp-logo-dark.svg"
            alt="Shamp Logo"
            width={64}
            height={32}
            className="hidden dark:block"
          />
        </section>
      </SidebarFooter>
    </Sidebar>
  );
} 