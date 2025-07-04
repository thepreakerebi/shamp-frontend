"use client";

import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";

export function WorkspaceSwitcher() {
  const { user, switchWorkspace, currentWorkspaceId, workspaceAdmin } = useAuth();

  if (!user || !user.workspaces || user.workspaces.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-medium">
        No workspace
      </p>
    );
  }

  // Find current workspace details
  const currentWorkspace = user.workspaces.find(ws => ws._id === currentWorkspaceId);
  const isOwner = currentWorkspace?.isOwner || false;

  // Display text for the current workspace
  const getWorkspaceDisplayText = () => {
    if (isOwner) {
      return 'Your workspace';
    }
    return `${workspaceAdmin?.firstName || 'Admin'}'s workspace`;
  };

  // Handle workspace selection
  const handleWorkspaceSelect = (workspaceId: string) => {
    if (workspaceId !== currentWorkspaceId) {
      switchWorkspace(workspaceId);
    }
  };

  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-auto p-0 text-left justify-start font-medium text-sm text-muted-foreground hover:text-foreground"
        >
          {getWorkspaceDisplayText()}
          <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
        </Button>
      </CustomDropdownMenuTrigger>
      
      <CustomDropdownMenuContent align="start" className="w-64">
        {user.workspaces.map((workspace) => {
          const isCurrentWorkspace = workspace._id === currentWorkspaceId;
          const isWorkspaceOwner = workspace.isOwner;
          
          return (
            <CustomDropdownMenuItem
              key={workspace._id}
              onSelect={() => handleWorkspaceSelect(workspace._id)}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium truncate">
                    {workspace.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {workspace.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
                
                {isWorkspaceOwner && (
                  <Badge variant="secondary" className="text-xs">
                    Your workspace
                  </Badge>
                )}
              </div>
              
              {isCurrentWorkspace && (
                <Check className="h-4 w-4 text-primary ml-2" />
              )}
            </CustomDropdownMenuItem>
          );
        })}
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 