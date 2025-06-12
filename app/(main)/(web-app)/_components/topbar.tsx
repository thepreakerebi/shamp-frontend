"use client";
import React from "react";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { CreateProjectButton } from './create-project-button';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { useCreatePersonaModal } from '@/app/(main)/(web-app)/personas/_components/create-persona-modal';
import { CreateDropdownButton } from './create-persona-dropdown-button';
import { useCreateBatchPersonasModal } from '@/app/(main)/(web-app)/personas/_components/create-batch-personas-modal';
import { useImportPersonasModal } from '@/app/(main)/(web-app)/personas/_components/import-personas-modal';

export function Topbar() {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const { setOpen: setCreatePersonaOpen } = useCreatePersonaModal();
  const { setOpen: setBatchModalOpen } = useCreateBatchPersonasModal();
  const { setOpen: setImportModalOpen } = useImportPersonasModal();

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
          <CreateDropdownButton
            onSinglePersona={() => setCreatePersonaOpen(true)}
            onBatchPersonas={() => setBatchModalOpen(true)}
            onImportFile={() => setImportModalOpen(true)}
          />
        )}
        {/* Add more buttons for other pages here as needed */}
      </section>
    </section>
  );
} 