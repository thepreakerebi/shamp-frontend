"use client";
import React, { useEffect } from "react";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { CreateProjectButton } from './create-project-button';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { CreateDropdownButton } from './create-persona-dropdown-button';
import { useImportPersonasModal } from '@/app/(main)/(web-app)/personas/_components/import-personas-modal';
import { CreateTestDropdownButton } from '@/app/(main)/(web-app)/tests/_components/create-test-dropdown-button';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { StartTestRunModal } from '@/app/(main)/(web-app)/test-runs/_components/start-test-run-modal';

// Force dynamic rendering since this component includes Breadcrumbs that uses useSearchParams
export const dynamic = 'force-dynamic';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile } = useSidebar();
  // const { setOpen: setBatchModalOpen } = useCreateBatchPersonasModal();
  const { setOpen: setImportModalOpen } = useImportPersonasModal();
  const [modalOpen, setModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false); // project
  const [editLoading, setEditLoading] = useState(false); // project
  const [createPersonaLoading, setCreatePersonaLoading] = useState(false);
  const [editPersonaLoading, setEditPersonaLoading] = useState(false);
  const [createBatchLoading, setCreateBatchLoading] = useState(false);

  // Only shift when expanded on desktop
  const isExpandedDesktop = !isMobile && state === 'expanded';
  const left = isExpandedDesktop ? '16rem' : '0';
  const width = isExpandedDesktop ? 'calc(100% - 16rem)' : '100%';

  // TODO: Replace with real modal handlers when implemented
  const handleSingleTest = () => router.push('/tests/create');
  const handleBatchTests = () => router.push('/tests/create-batch');
  const handleStartTest = () => setModalOpen(true);

  // Submit create-project form when on /home/create
  const handleSubmitProject = () => {
    const form = document.getElementById('create-project-form') as HTMLFormElement | null;
    form?.requestSubmit();
  };

  // Listen for loading state broadcast from create-project page
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreateLoading(custom.detail);
    };
    window.addEventListener('create-project-loading', listener);
    return () => window.removeEventListener('create-project-loading', listener);
  }, []);

  // Listen for edit project loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setEditLoading(custom.detail);
    };
    window.addEventListener('edit-project-loading', listener);
    return () => window.removeEventListener('edit-project-loading', listener);
  }, []);

  // Listen for create persona loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreatePersonaLoading(custom.detail);
    };
    window.addEventListener('create-persona-loading', listener);
    return () => window.removeEventListener('create-persona-loading', listener);
  }, []);

  // Listen for edit persona loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setEditPersonaLoading(custom.detail);
    };
    window.addEventListener('edit-persona-loading', listener);
    return () => window.removeEventListener('edit-persona-loading', listener);
  }, []);

  // Create batch loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreateBatchLoading(custom.detail);
    };
    window.addEventListener('create-batch-persona-loading', listener);
    return () => window.removeEventListener('create-batch-persona-loading', listener);
  }, []);

  // Reset loading when navigating away after submission
  useEffect(() => {
    if (pathname !== '/home/create' && createLoading) {
      setCreateLoading(false);
    }
  }, [pathname, createLoading]);

  // Reset persona loading when navigating away
  useEffect(() => {
    if (pathname !== '/personas/create' && createPersonaLoading) {
      setCreatePersonaLoading(false);
    }
  }, [pathname, createPersonaLoading]);

  useEffect(() => {
    if (!/^\/personas\/[^/]+\/edit$/.test(pathname) && editPersonaLoading) {
      setEditPersonaLoading(false);
    }
  }, [pathname, editPersonaLoading]);

  useEffect(() => {
    if (pathname !== '/personas/batch/create' && createBatchLoading) {
      setCreateBatchLoading(false);
    }
  }, [pathname, createBatchLoading]);

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
            onSinglePersona={() => router.push('/personas/create')}
            onBatchPersonas={() => router.push('/personas/batch/create')}
            onImportFile={() => setImportModalOpen(true)}
          />
        )}
        {pathname === '/tests' && (
          <CreateTestDropdownButton
            onSingleTest={handleSingleTest}
            onBatchTests={handleBatchTests}
          />
        )}
        {pathname === '/test-runs' && (
          <Button variant="secondary" onClick={handleStartTest}>
            Run test
          </Button>
        )}
        {pathname === '/home/create' && (
          <Button variant="default" onClick={handleSubmitProject} disabled={createLoading} className="flex items-center gap-2">
            {createLoading && <Loader2 className="animate-spin size-4" />}
            {createLoading ? 'Creating…' : 'Create project'}
          </Button>
        )}
        {/^\/home\/[^/]+\/edit$/.test(pathname) && (
          <Button variant="default" onClick={() => {
            const form = document.getElementById('edit-project-form') as HTMLFormElement | null;
            form?.requestSubmit();
          }} disabled={editLoading} className="flex items-center gap-2">
            {editLoading && <Loader2 className="animate-spin size-4" />}
            {editLoading ? 'Saving…' : 'Save changes'}
          </Button>
        )}
        {pathname === '/personas/create' && (
          <Button variant="default" onClick={() => {
            const form = document.getElementById('create-persona-form') as HTMLFormElement | null;
            form?.requestSubmit();
          }} disabled={createPersonaLoading} className="flex items-center gap-2">
            {createPersonaLoading && <Loader2 className="animate-spin size-4" />}
            {createPersonaLoading ? 'Creating…' : 'Create persona'}
          </Button>
        )}
        {pathname === '/personas/batch/create' && (
          <Button variant="default" onClick={() => {
            const form = document.getElementById('create-batch-persona-form') as HTMLFormElement | null;
            form?.requestSubmit();
          }} disabled={createBatchLoading} className="flex items-center gap-2">
            {createBatchLoading && <Loader2 className="animate-spin size-4" />}
            {createBatchLoading ? 'Creating…' : 'Create batch'}
          </Button>
        )}
        {/^\/personas\/[^/]+\/edit$/.test(pathname) && (
          <Button variant="default" onClick={() => {
            const form = document.getElementById('edit-persona-form') as HTMLFormElement | null;
            form?.requestSubmit();
          }} disabled={editPersonaLoading} className="flex items-center gap-2">
            {editPersonaLoading && <Loader2 className="animate-spin size-4" />}
            {editPersonaLoading ? 'Saving…' : 'Save changes'}
          </Button>
        )}
        <StartTestRunModal open={modalOpen} onOpenChange={setModalOpen} />
        {/* Add more buttons for other pages here as needed */}
      </section>
    </section>
  );
} 