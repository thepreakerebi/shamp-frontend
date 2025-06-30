"use client";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface SettingsTabProps {
  tabs: Array<{ key: string; label: string }>;
}

export function SettingsTab({ tabs }: SettingsTabProps) {
  return (
    <TabsList aria-label="Settings tabs">
      {tabs.map(tab => (
        <TabsTrigger
          type="button"
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