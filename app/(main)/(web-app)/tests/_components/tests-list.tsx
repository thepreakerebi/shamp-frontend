"use client";
import React from "react";
import { TestsTable } from "./tests-table";

export function TestsList() {
  return (
    <>
      {/* Mobile cards to be implemented later */}
      <section className="block md:hidden p-4 text-center text-sm text-muted-foreground border border-dashed rounded-2xl">
        Tests list (mobile) coming soon.
      </section>
      {/* Desktop table */}
      <section className="hidden md:block w-full">
        <TestsTable />
      </section>
    </>
  );
} 