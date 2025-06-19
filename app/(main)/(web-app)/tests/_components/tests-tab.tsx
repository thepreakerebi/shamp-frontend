"use client";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_LIST = [
  { key: "individuals", label: "Individuals" },
  { key: "groups", label: "Groups" },
  { key: "schedules", label: "Schedules" },
];

export function TestsTab() {
  return (
    <TabsList aria-label="Tests tabs">
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