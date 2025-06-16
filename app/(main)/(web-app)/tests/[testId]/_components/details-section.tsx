"use client";
import { Test } from "@/hooks/use-tests";

export default function DetailsSection({ test }: { test: Test }) {
  return (
    <section className="p-4 space-y-2">
      <h2 className="text-xl font-semibold">Details</h2>
      <p>{test.name}</p>
    </section>
  );
} 