"use client";
import React from "react";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { CreateProjectButton } from './create-project-button';
import { usePathname } from 'next/navigation';

export function Topbar() {
  const pathname = usePathname();
  return (
    <section className="flex flex-row items-center justify-between p-4 w-full">
      <section className="flex flex-row items-center gap-4">
        <SidebarTrigger />
        <Breadcrumbs />
      </section>
      <section className="flex flex-row items-center gap-4">
        {pathname === '/home' && <CreateProjectButton />}
        {/* Add more buttons for other pages here as needed */}
      </section>
    </section>
  );
} 