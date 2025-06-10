"use client";
import React from "react";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { CreateProjectButton } from './create-project-button';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

export function Topbar() {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();

  // Only shift when expanded on desktop
  const isExpandedDesktop = !isMobile && state === 'expanded';
  const left = isExpandedDesktop ? '16rem' : '0';
  const width = isExpandedDesktop ? 'calc(100% - 16rem)' : '100%';

  return (
    <section
      className="fixed top-0 right-0 z-20 flex flex-row items-center justify-between p-4 w-full transition-all duration-200 bg-background"
      style={{
        left,
        width,
      }}
    >
      <section className="flex flex-row items-center gap-4">
        <SidebarTrigger />
        <Breadcrumbs />
      </section>
      <section className="flex flex-row items-center gap-4">
        {pathname === '/home' && <CreateProjectButton />}
        {pathname === '/personas' && (
          <section className="flex flex-row items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Personas">
              <Users className="size-5" />
            </Button>
            <Button variant="outline"><Plus className="size-4 mr-2" /> Create persona</Button>
          </section>
        )}
        {/* Add more buttons for other pages here as needed */}
      </section>
    </section>
  );
} 