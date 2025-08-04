"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CustomDropdownMenu,
  CustomDropdownMenuTrigger,
  CustomDropdownMenuContent,
  CustomDropdownMenuItem,
} from "@/components/ui/custom-dropdown-menu";

export function NeedHelpDropdown() {
  const email = "help@shamp.io";

  const copyEmail = () => {
    navigator.clipboard.writeText(email).then(() => {
      toast.success("Email copied to clipboard");
    });
  };

  const openBooking = () => {
    window.open("https://cal.com/shamp/need-help", "_blank", "noopener,noreferrer");
  };

  const reportBug = () => {
    window.open("https://tally.so/r/mDRMb5", "_blank", "noopener,noreferrer");
  };

  return (
    <CustomDropdownMenu>
      <CustomDropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          Need help?
        </Button>
      </CustomDropdownMenuTrigger>
      <CustomDropdownMenuContent align="end" className="w-56">
        <CustomDropdownMenuItem onSelect={copyEmail} className="flex items-center justify-between gap-2">
          <span>{email}</span>
          <Copy className="size-4 opacity-60" />
        </CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={openBooking}>Book a call</CustomDropdownMenuItem>
        <CustomDropdownMenuItem onSelect={reportBug}>Report a bug</CustomDropdownMenuItem>
      </CustomDropdownMenuContent>
    </CustomDropdownMenu>
  );
} 