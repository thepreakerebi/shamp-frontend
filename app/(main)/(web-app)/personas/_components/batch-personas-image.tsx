"use client";
import React from "react";
import Image from "next/image";

interface BatchPersonasImageProps {
  avatarUrls: string[];
  size?: number; // default 64
  alt?: string;
}

const SLOT_COUNT = 9;
const GRID_SIZE = 3;
const CONTAINER_SIZE = 64;
const SLOT_SIZE = Math.floor(CONTAINER_SIZE / GRID_SIZE); // ~21

export function BatchPersonasImage({ avatarUrls, size = CONTAINER_SIZE, alt = "Batch personas" }: BatchPersonasImageProps) {
  // Repeat or slice avatars to fill 9 slots
  const avatars = Array.from({ length: SLOT_COUNT }, (_, i) =>
    avatarUrls.length > 0 ? avatarUrls[i % avatarUrls.length] : undefined
  );

  return (
    <div
      className="relative rounded-full overflow-hidden bg-muted"
      style={{ width: size, height: size, display: "grid", gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
      aria-label={alt}
    >
      {avatars.map((url, idx) => (
        <div
          key={idx}
          className="flex items-center justify-center"
          style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
        >
          {url ? (
            <Image
              src={url}
              alt={alt}
              width={SLOT_SIZE}
              height={SLOT_SIZE}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div
              className="rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-400"
              style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
            >
              {/* Optionally show fallback initials or icon */}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 