"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { usePersonasStore } from "@/lib/store/personas";
import Image from "next/image";
import { PersonaCardDropdown } from "../_components/persona-card-dropdown";
import { DeletePersonaModal } from "../_components/delete-persona-modal";
import { usePersonas } from "@/hooks/use-personas";
import { toast } from "sonner";
import { PersonaDetailsSkeleton } from "./_components/persona-details-skeleton";
import PersonaNotFound from "./not-found";
import { useRouter } from "next/navigation";

export default function PersonaPage() {
  const { personaId } = useParams();
  const personas = usePersonasStore((s) => s.personas);
  const personasError = usePersonasStore((s) => s.personasError);
  const persona = personas?.find((p) => p._id === personaId) || null;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [justDeleted, setJustDeleted] = useState(false);
  const { deletePersona } = usePersonas();

  const router = useRouter();

  // Show skeleton while store is not yet populated
  if (personas === null) {
    return <PersonaDetailsSkeleton />;
  }

  // If there was an error loading personas, show a user-friendly error
  if (personasError) {
    return (
      <div className="py-8 text-center text-destructive">
        Failed to load personas. Please try again later.
      </div>
    );
  }

  // If persona was just deleted, skip rendering to avoid not-found flash
  if (justDeleted) return null;

  // If store is loaded and persona is not found, show not-found page
  if (!persona) {
    return <PersonaNotFound />;
  }

  return (
    <main className="p-4 w-full flex flex-col gap-6 max-w-2xl mx-auto">
      {/* 1. Top Section: Avatar, Name & Gender, Dropdown */}
      <section className="flex items-center gap-6 w-full">
        {/* Avatar */}
        <section className="flex-shrink-0">
          {persona.avatarUrl ? (
            <Image
              src={persona.avatarUrl}
              alt={persona.name}
              className="rounded-full object-cover w-20 h-20 border border-border bg-muted"
              width={80}
              height={80}
              unoptimized
            />
          ) : (
            <section className="rounded-full w-20 h-20 flex items-center justify-center bg-muted text-muted-foreground border border-border text-3xl font-bold">
              {persona.name?.[0]?.toUpperCase() || "?"}
            </section>
          )}
        </section>
        {/* Name & Gender */}
        <section className="flex flex-col flex-1 min-w-0 gap-1">
          <h1 className="text-3xl font-bold text-foreground truncate" title={persona.name}>{persona.name}</h1>
          <span className="text-base text-muted-foreground">{persona.gender || "-"}</span>
        </section>
        {/* Dropdown */}
        <section className="flex-shrink-0">
          <PersonaCardDropdown
            showOpen={false}
            onEdit={() => router.push(`/personas/${persona._id}/edit`)}
            onDelete={() => setDeleteOpen(true)}
          />
        </section>
      </section>

      {/* 2. Description */}
      <section className="w-full">
        <header className="mb-1 font-semibold text-base">Description</header>
        <p className="text-muted-foreground w-full">
          {persona.description?.trim()
            ? persona.description
            : "No description provided for this persona. Add a description to give more context about this persona's background, motivations, and unique characteristics."}
        </p>
      </section>

      {/* 3. Background */}
      {persona.background && (
        <section className="w-full">
          <header className="mb-1 font-semibold text-base">Background</header>
          <p className="text-muted-foreground w-full">{persona.background}</p>
        </section>
      )}

      {/* 4. Goals */}
      {persona.goals && persona.goals.length > 0 && (
        <section className="w-full">
          <header className="mb-1 font-semibold text-base">Goals</header>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {persona.goals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. Frustrations */}
      {persona.frustrations && persona.frustrations.length > 0 && (
        <section className="w-full">
          <header className="mb-1 font-semibold text-base">Frustrations</header>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {persona.frustrations.map((frustration, i) => (
              <li key={i}>{frustration}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. Traits */}
      {persona.traits && (
        Array.isArray(persona.traits) ? (
          persona.traits.length > 0 && (
            <section className="w-full">
              <header className="mb-1 font-semibold text-base">Traits</header>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {persona.traits.map((trait, i) => (
                  <li key={i}>{typeof trait === "string" ? trait : JSON.stringify(trait)}</li>
                ))}
              </ul>
            </section>
          )
        ) : (
          Object.keys(persona.traits).length > 0 && (
            <section className="w-full">
              <header className="mb-1 font-semibold text-base">Traits</header>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {Object.entries(persona.traits).map(([key, value]) => (
                  <li key={key}><span className="font-medium">{key}:</span> {String(value)}</li>
                ))}
              </ul>
            </section>
          )
        )
      )}

      {/* 7. Preferred Devices */}
      {persona.preferredDevices && persona.preferredDevices.length > 0 && (
        <section className="w-full">
          <header className="mb-1 font-semibold text-base">Preferred Devices</header>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {persona.preferredDevices.map((device, i) => (
              <li key={i}>{device}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Delete Persona Modal */}
      <DeletePersonaModal
        open={deleteOpen}
        setOpen={setDeleteOpen}
        persona={persona}
        loading={deleteLoading}
        onConfirm={async () => {
          if (!persona) return;
          setDeleteLoading(true);
          try {
            await deletePersona(persona._id);
            toast.success("Persona deleted!");
            setJustDeleted(true);
            router.push("/personas");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete persona");
          } finally {
            setDeleteLoading(false);
          }
        }}
      />
    </main>
  );
}
