"use client";
import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { SettingsTab } from "./_components/settings-tab";
import { ProfileSection } from "./_components/profile-section";
import { SecuritySection } from "./_components/security-section";
import { MembersSection } from "./_components/members-section";
import { SubscriptionSection } from "./_components/subscription-section";
import { useAuth } from "@/lib/auth";

const TAB_OPTIONS = [
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "members", label: "Members" },
  { key: "subscription", label: "Subscription & Usage" },
];

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const filteredTabs = TAB_OPTIONS.filter(t => {
    if (isAdmin) return true;
    return t.key !== "members" && t.key !== "subscription";
  });

  const searchParams = useSearchParams();
  const initialParam = searchParams.get("tab");
  const allowedKeys = filteredTabs.map(t => t.key);
  const initialTab: string = allowedKeys.includes(initialParam ?? "") ? (initialParam as string) : (filteredTabs[0].key as string);
  const [tab, setTab] = useState(initialTab);

  return (
    <main className="p-4 w-full flex flex-col gap-8">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Tabs value={tab as any} onValueChange={(v)=>setTab(v as string)} className="flex-1 w-full">
        <nav className="flex flex-col md:flex-row gap-4 w-full" aria-label="Settings navigation">
          <SettingsTab tabs={filteredTabs} />
          <section className="flex-1 min-w-0">
            <TabsContent value="profile"><ProfileSection /></TabsContent>
            <TabsContent value="security"><SecuritySection /></TabsContent>
            {isAdmin && (
              <TabsContent value="members"><MembersSection /></TabsContent>
            )}
            {isAdmin && (
              <TabsContent value="subscription"><SubscriptionSection /></TabsContent>
            )}
          </section>
        </nav>
      </Tabs>
    </main>
  );
}
