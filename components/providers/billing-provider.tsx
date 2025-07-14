"use client";
import React from "react";
import { useBilling } from "@/hooks/use-billing";

export function BillingProvider({ children }: { children: React.ReactNode }) {
  // Initialize billing summary once for the app tree
  useBilling();
  return <>{children}</>;
} 