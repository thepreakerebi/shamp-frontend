"use client";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_LIST = [
  { key: "details", label: "Details" },
  { key: "tests", label: "Tests" },
  { key: "testruns", label: "Testruns" },
];

export function ProjectDetailsTab() {
  return (
    <TabsList aria-label="Project details tabs">
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

// Usage example (remove if you want to use children/props):
// <ProjectDetailsTab value="details" onValueChange={(value) => console.log(value)}>
//   {/* Tab content goes here */}
// </ProjectDetailsTab> 