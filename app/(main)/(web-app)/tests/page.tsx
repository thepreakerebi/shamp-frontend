"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export default function TestsPage() {
  // Dummy data until backend list page is implemented
  const dummyTests = [
    { _id: "1", name: "Checkout flow", description: "End-to-end checkout" },
    { _id: "2", name: "Onboarding", description: "Signup and tutorial" },
    { _id: "3", name: "Profile settings", description: "Update email & password" },
  ];

  return (
    <section className="p-6 flex flex-col gap-4 max-w-3xl w-full mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Tests (dummy)</h1>

      {dummyTests.map((t) => (
        <Card key={t._id} className="bg-card/90">
          <CardContent className="p-4 flex items-center gap-4">
            <ListChecks className="text-foreground" size={20} />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{t.name}</span>
              <span className="text-sm text-muted-foreground">{t.description}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
