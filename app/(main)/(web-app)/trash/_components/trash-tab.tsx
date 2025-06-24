"use client";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_LIST = [
  { key: "projects", label: "Projects" },
  { key: "tests", label: "Tests" },
  { key: "batch", label: "Batch tests" },
  { key: "schedules", label: "Schedules" },
  { key: "runs", label: "Test runs" },
];

export function TrashTab() {
  return (
    <TabsList aria-label="Trash tabs">
      {TAB_LIST.map((tab) => (
        <TabsTrigger
          key={tab.key}
          value={tab.key}
          className="text-left w-full md:rounded-lg rounded-none"
        >
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
} 