"use client";
import { NodeProps } from "reactflow";
import Image from "next/image";

interface StepData {
  screenshot?: string | null;
  description?: string; // evaluation_previous_goal
  nextGoal?: string; // next_goal
}

export default function StepNode({ data }: NodeProps<StepData>) {
  return (
    <section className="flex flex-col gap-2 max-w-[280px]">
      {/* Text block */}
      <section className="flex flex-col gap-1 text-sm leading-snug bg-card rounded-lg p-3 shadow">
        {data.description && (
          <p className="whitespace-pre-line">{data.description}</p>
        )}
        {data.nextGoal && (
          <p className="text-muted-foreground whitespace-pre-line">
            → {data.nextGoal}
          </p>
        )}
      </section>

      {/* Screenshot */}
      {data.screenshot && (
        <figure className="rounded-lg overflow-hidden border bg-muted">
          <Image
            src={data.screenshot}
            alt="Step screenshot"
            width={400}
            height={250}
            className="w-full h-auto object-cover"
            unoptimized
          />
        </figure>
      )}
    </section>
  );
} 