"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(firstName?: string, lastName?: string, email?: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

export function WorkspaceGreetingHeader() {
  const { user, loading, currentWorkspaceId } = useAuth();
  const currentWs = user?.workspaces?.find((w) => w._id === currentWorkspaceId);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const workspaceLabel = currentWs?.isOwner ? "My workspace" : currentWs?.name ?? "My workspace";

  return (
    <section className="flex flex-col gap-2 w-full">
      {loading ? (
        <Skeleton className="h-4 w-40" />
      ) : (
        <span className="text-sm w-full text-muted-foreground">{workspaceLabel}</span>
      )}
      <section className="flex items-center gap-3 w-full">
        {loading ? (
          <Skeleton className="size-8 rounded-full" />
        ) : (
          <Avatar>
            {user?.profilePicture ? (
              <AvatarImage
                src={user.profilePicture}
                alt={user.firstName || user.email || "User"}
              />
            ) : (
              <AvatarFallback>
                {getInitials(user?.firstName, user?.lastName, user?.email)}
              </AvatarFallback>
            )}
          </Avatar>
        )}
        {loading ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <span className="text-2xl w-full font-semibold">
            {greeting}, {user?.firstName || ""} {user?.lastName || ""}
          </span>
        )}
      </section>
    </section>
  );
} 