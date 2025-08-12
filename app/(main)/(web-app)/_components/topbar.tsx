"use client";
import React, { useEffect } from "react";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { CreateProjectButton } from './create-project-button';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { CreateDropdownButton } from './create-persona-dropdown-button';
// import { useImportPersonasModal } from '@/app/(main)/(web-app)/personas/_components/import-personas-modal';
import { CreateTestDropdownButton } from '@/app/(main)/(web-app)/tests/_components/create-test-dropdown-button';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { StartTestRunModal } from '@/app/(main)/(web-app)/test-runs/_components/start-test-run-modal';
import { useBilling } from '@/hooks/use-billing';
import { Plus } from 'lucide-react';
import CheckDialog from '@/components/autumn/check-dialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';

// Force dynamic rendering since this component includes Breadcrumbs that uses useSearchParams
export const dynamic = 'force-dynamic';

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile } = useSidebar();
  // const { setOpen: setBatchModalOpen } = useCreateBatchPersonasModal();
  // const { setOpen: setImportModalOpen } = useImportPersonasModal();
  const [modalOpen, setModalOpen] = useState(false);
  const [showPaywallTest, setShowPaywallTest] = useState(false);
  const [showPaywallPersona, setShowPaywallPersona] = useState(false);
  const [showPaywallRun, setShowPaywallRun] = useState(false);
  const [createLoading, setCreateLoading] = useState(false); // project
  // const [editLoading, setEditLoading] = useState(false); // project (moved to Bottombar)
  const [createPersonaLoading, setCreatePersonaLoading] = useState(false);
  const [editPersonaLoading, setEditPersonaLoading] = useState(false);
  // const [createPersonaDirty, setCreatePersonaDirty] = useState(false); // handled in Bottombar
  // const [editPersonaDirty, setEditPersonaDirty] = useState(false); // handled in Bottombar
  const [createBatchLoading, setCreateBatchLoading] = useState(false);
  // const [createBatchPersonaDirty, setCreateBatchPersonaDirty] = useState(false); // handled in Bottombar
  const [createTestLoading, setCreateTestLoading] = useState(false);
  const [editTestLoading, setEditTestLoading] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [createBatchTestLoading, setCreateBatchTestLoading] = useState(false);
  const [editBatchTestLoading, setEditBatchTestLoading] = useState(false);
  const [createBatchTestDirty, setCreateBatchTestDirty] = useState(false);
  const [editBatchTestDirty, setEditBatchTestDirty] = useState(false);
  const [createTestDirty, setCreateTestDirty] = useState(false);
  const [editTestDirty, setEditTestDirty] = useState(false);
  // const [createProjectDirty, setCreateProjectDirty] = useState(false);
  // const [editProjectDirty, setEditProjectDirty] = useState(false);

  // Billing info to determine feature availability
  const { summary, loading: billingLoading, allowed } = useBilling();

  const planName =
    summary?.products && Array.isArray(summary.products) && summary.products.length > 0
      ? (summary.products[0] as { name?: string; id?: string }).name ||
        (summary.products[0] as { id?: string }).id
      : 'Free';

  // Treat annual variants (e.g. hobby_annual, Hobby - Annual) the same as the base plan
  const normalizedPlan = (planName ?? '')
    .toLowerCase()
    .replace(/(_annual$|\s-\s*annual$)/, '');
  const isFreeOrHobby = !billingLoading && ['free', 'hobby', 'pro'].includes(normalizedPlan);

  // Only shift when expanded on desktop
  const isExpandedDesktop = !isMobile && state === 'expanded';
  const left = isExpandedDesktop ? '16rem' : '0';
  const width = isExpandedDesktop ? 'calc(100% - 16rem)' : '100%';

  // Paywall preview builder for personas feature
  const getPersonaPreview = () => {
    const features: unknown = summary?.features;
    let feature: unknown;
    if (Array.isArray(features)) {
      feature = features.find((f) => (f as { feature_id: string }).feature_id === 'personas');
    } else if (features && typeof features === 'object') {
      feature = (features as Record<string, unknown>)['personas'];
    }
    const bal = (feature as { balance?: number })?.balance;
    const usageExhausted = typeof bal === 'number' && bal <= 0;

    const nextProduct = {
      id: 'hobby',
      name: 'Hobby Plan',
      is_add_on: false,
      free_trial: undefined,
    } as unknown as Record<string, unknown>;

    return {
      scenario: usageExhausted ? 'usage_limit' : 'feature_flag',
      feature_id: 'personas',
      feature_name: 'Personas',
      product_id: 'hobby',
      products: [nextProduct],
    };
  };

  // Paywall preview builder for tests feature
  const getTestPreview = () => {
    const features: unknown = summary?.features;
    let feature: unknown;
    if (Array.isArray(features)) {
      feature = features.find((f) => (f as { feature_id: string }).feature_id === 'tests');
    } else if (features && typeof features === 'object') {
      feature = (features as Record<string, unknown>)['tests'];
    }
    const bal = (feature as { balance?: number })?.balance;
    const usageExhausted = typeof bal === 'number' && bal <= 0;

    const nextProduct = {
      id: 'hobby',
      name: 'Hobby Plan',
      is_add_on: false,
      free_trial: undefined,
    } as unknown as Record<string, unknown>;

    return {
      scenario: usageExhausted ? 'usage_limit' : 'feature_flag',
      feature_id: 'tests',
      feature_name: 'Tests',
      product_id: 'hobby',
      products: [nextProduct],
    };
  };

  const getCreditsRunPreview = () => {
    const features: unknown = summary?.features;
    let feature: unknown;
    if (Array.isArray(features)) {
      feature = features.find((f) => (f as { feature_id: string }).feature_id === 'credits');
    } else if (features && typeof features === 'object') {
      feature = (features as Record<string, unknown>)['credits'];
    }
    const bal = (feature as { balance?: number })?.balance;
    const usageExhausted = typeof bal === 'number' && bal < 1;

    const nextProduct = {
      id: 'hobby',
      name: 'Hobby Plan',
      is_add_on: false,
      free_trial: undefined,
    } as unknown as Record<string, unknown>;

    return {
      scenario: usageExhausted ? 'usage_limit' : 'feature_flag',
      feature_id: 'credits',
      feature_name: 'Credits',
      product_id: 'hobby',
      products: [nextProduct],
    };
  };

  const handleSingleTest = () => {
    if (allowed({ featureId: 'tests' })) {
      router.push('/tests/create');
    } else {
      setShowPaywallTest(true);
    }
  };

  const handleSinglePersona = () => {
    if (allowed({ featureId: 'personas' })) {
      router.push('/personas/create');
    } else {
      setShowPaywallPersona(true);
    }
  };
  const handleBatchTests = () => router.push('/tests/create-batch');

  const handleSubmitCreateTest = () => {
    const form = document.getElementById('create-test-form') as HTMLFormElement | null;
    form?.requestSubmit();
  };
  const handleCancelCreateTest = () => {
    if (createTestDirty) {
      setConfirmLeaveOpen(true);
    } else {
      router.back();
    }
  };
  const handleSubmitEditTest = () => {
    const form = document.getElementById('edit-test-form') as HTMLFormElement | null;
    form?.requestSubmit();
  };
  const handleCancelEditTest = () => {
    if (editTestDirty) {
      setConfirmLeaveOpen(true);
    } else {
      router.back();
    }
  };
  const handleStartTest = () => {
    if (allowed({ featureId: 'credits', requiredBalance: 1 })) {
      setModalOpen(true);
    } else {
      setShowPaywallRun(true);
    }
  };

  // Submit create-project form when on /home/create
  // Handlers moved to Bottombar for project create/edit

  // Listen for loading state broadcast from create-project page
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreateLoading(custom.detail);
    };
    window.addEventListener('create-project-loading', listener);
    return () => window.removeEventListener('create-project-loading', listener);
  }, []);

  // Project dirty handled in Bottombar

  // Project dirty handled in Bottombar

  // Edit project loading handled in Bottombar

  // Listen for create persona loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreatePersonaLoading(custom.detail);
    };
    window.addEventListener('create-persona-loading', listener);
    return () => window.removeEventListener('create-persona-loading', listener);
  }, []);

  // Persona dirty handled in Bottombar

  // Listen for create test loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreateTestLoading(custom.detail);
    };
    window.addEventListener('create-test-loading', listener);
    return () => window.removeEventListener('create-test-loading', listener);
  }, []);

  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreateTestDirty(Boolean(custom.detail));
    };
    window.addEventListener('create-test-dirty', listener);
    return () => window.removeEventListener('create-test-dirty', listener);
  }, []);

  // Listen for edit test loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setEditTestLoading(custom.detail);
    };
    window.addEventListener('edit-test-loading', listener);
    return () => window.removeEventListener('edit-test-loading', listener);
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

  // Persona dirty handled in Bottombar

  // Create batch loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreateBatchLoading(custom.detail);
    };
    window.addEventListener('create-batch-persona-loading', listener);
    return () => window.removeEventListener('create-batch-persona-loading', listener);
  }, []);

  // Create batch dirty handled in Bottombar

  // Reset loading when navigating away after submission
  useEffect(() => {
    if (pathname !== '/home/create' && createLoading) {
      setCreateLoading(false);
    }
  }, [pathname, createLoading]);

  // Reset create test loading when navigating away
  useEffect(() => {
    if (pathname !== '/tests/create' && createTestLoading) {
      setCreateTestLoading(false);
    }
  }, [pathname, createTestLoading]);

  // Reset edit test loading when navigating away
  useEffect(() => {
    if (!/^\/tests\/[^/]+\/edit$/.test(pathname) && editTestLoading) {
      setEditTestLoading(false);
    }
  }, [pathname, editTestLoading]);

  // Listen for create-batch test loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreateBatchTestLoading(custom.detail);
    };
    window.addEventListener('create-batch-test-loading', listener);
    return () => window.removeEventListener('create-batch-test-loading', listener);
  }, []);

  // Listen for edit-batch test loading
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setEditBatchTestLoading(custom.detail);
    };
    window.addEventListener('edit-batch-test-loading', listener);
    return () => window.removeEventListener('edit-batch-test-loading', listener);
  }, []);

  // Listen for create-batch test dirty
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setCreateBatchTestDirty(Boolean(custom.detail));
    };
    window.addEventListener('create-batch-test-dirty', listener);
    return () => window.removeEventListener('create-batch-test-dirty', listener);
  }, []);

  // Listen for edit-batch test dirty
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setEditBatchTestDirty(Boolean(custom.detail));
    };
    window.addEventListener('edit-batch-test-dirty', listener);
    return () => window.removeEventListener('edit-batch-test-dirty', listener);
  }, []);

  // Listen for edit test dirty state
  useEffect(() => {
    const listener = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setEditTestDirty(Boolean(custom.detail));
    };
    window.addEventListener('edit-test-dirty', listener);
    return () => window.removeEventListener('edit-test-dirty', listener);
  }, []);

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
          isFreeOrHobby ? (
            <Button variant="outline" className="gap-2" onClick={handleSinglePersona}>
              <Plus className="size-4" /> Create persona
            </Button>
          ) : (
            <CreateDropdownButton
              onSinglePersona={handleSinglePersona}
              onBatchPersonas={() => router.push('/personas/batch/create')}
              // onImportFile={() => setImportModalOpen(true)}
            />
          )
        )}
        {pathname === '/tests/create-batch' && (
          <section className="flex flex-row items-center gap-2">
            <Button type="button" variant="outline" onClick={() => {
              if (createBatchTestDirty) {
                setConfirmLeaveOpen(true);
              } else {
                router.back();
              }
            }} className="flex items-center gap-2">Cancel</Button>
            <Button variant="default" onClick={() => {
              const form = document.getElementById('create-batch-test-form') as HTMLFormElement | null;
              form?.requestSubmit();
            }} disabled={createBatchTestLoading} className="flex items-center gap-2">
              {createBatchTestLoading && <Loader2 className="animate-spin size-4" />}
              {createBatchTestLoading ? 'Creating…' : 'Create batch test'}
            </Button>
          </section>
        )}
        {pathname === '/tests' && (
          isFreeOrHobby ? (
            <Button variant="outline" className="gap-2" onClick={handleSingleTest}>
              <Plus className="size-4" /> Create test
            </Button>
          ) : (
            <CreateTestDropdownButton
              onSingleTest={handleSingleTest}
              onBatchTests={handleBatchTests}
            />
          )
        )}
        {pathname === '/tests/edit-batch' && (
          <section className="flex flex-row items-center gap-2">
            <Button type="button" variant="outline" onClick={() => {
              if (editBatchTestDirty) {
                setConfirmLeaveOpen(true);
              } else {
                router.back();
              }
            }} className="flex items-center gap-2">Cancel</Button>
            <Button variant="default" onClick={() => {
              const form = document.getElementById('edit-batch-test-form') as HTMLFormElement | null;
              form?.requestSubmit();
            }} disabled={editBatchTestLoading} className="flex items-center gap-2">
              {editBatchTestLoading && <Loader2 className="animate-spin size-4" />}
              {editBatchTestLoading ? 'Saving…' : 'Save changes'}
            </Button>
          </section>
        )}
        {pathname === '/test-runs' && (
          <Button variant="secondary" onClick={handleStartTest}>
            Run test
          </Button>
        )}
        {pathname === '/tests/create' && (
          <section className="flex flex-row items-center gap-2">
            <Button type="button" variant="outline" onClick={handleCancelCreateTest} className="flex items-center gap-2">Cancel</Button>
            <Button variant="default" onClick={handleSubmitCreateTest} disabled={createTestLoading} className="flex items-center gap-2">
              {createTestLoading && <Loader2 className="animate-spin size-4" />}
              {createTestLoading ? 'Creating…' : 'Create test'}
            </Button>
          </section>
        )}
        {/^\/tests\/[^/]+\/edit$/.test(pathname) && (
          <section className="flex flex-row items-center gap-2">
            <Button type="button" variant="outline" onClick={handleCancelEditTest} className="flex items-center gap-2">Cancel</Button>
            <Button variant="default" onClick={handleSubmitEditTest} disabled={editTestLoading} className="flex items-center gap-2">
              {editTestLoading && <Loader2 className="animate-spin size-4" />}
              {editTestLoading ? 'Saving…' : 'Save changes'}
            </Button>
          </section>
        )}
        {pathname === '/home/create' && null}
        {/^\/home\/[^/]+\/edit$/.test(pathname) && null}
        {pathname === '/personas/create' && null}
        {pathname === '/personas/batch/create' && null}
        {/^\/personas\/[^/]+\/edit$/.test(pathname) && null}
        <StartTestRunModal open={modalOpen} onOpenChange={setModalOpen} />
        {showPaywallTest && (
          /* @ts-expect-error preview partial */
          <CheckDialog open={showPaywallTest} setOpen={setShowPaywallTest} preview={getTestPreview()} />
        )}
        {showPaywallPersona && (
          /* @ts-expect-error preview partial */
          <CheckDialog open={showPaywallPersona} setOpen={setShowPaywallPersona} preview={getPersonaPreview()} />
        )}
        {showPaywallRun && (
          /* @ts-expect-error preview partial */
          <CheckDialog open={showPaywallRun} setOpen={setShowPaywallRun} preview={getCreditsRunPreview()} />
        )}
        <UnsavedChangesDialog
          open={confirmLeaveOpen}
          onOpenChange={setConfirmLeaveOpen}
          onDiscard={() => {
            setConfirmLeaveOpen(false);
            router.back();
          }}
        />
        {/* Add more buttons for other pages here as needed */}
      </section>
    </section>
  );
} 