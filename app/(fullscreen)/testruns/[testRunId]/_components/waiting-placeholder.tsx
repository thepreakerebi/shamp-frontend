"use client";
import { useEffect, useMemo, useState } from "react";
import { Smile, Home, MessageCircle, MousePointerClick, Palette } from "lucide-react";

const ICONS = [Smile, Home, MessageCircle, MousePointerClick, Palette];
const TEXTS = [
  "Working out the details…",
  "Setting up the test environment…",
  "Creating the perfect persona mindset…",
  "Preparing screenshots & steps…",
];

export default function WaitingPlaceholder() {
  // Cycle through helper texts
  const [textIdx, setTextIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setTextIdx((i) => (i + 1) % TEXTS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Generate icon configs once
  const icons = useMemo(() => {
    const count = 8; // total falling icons
    // Evenly-spaced horizontal positions with slight jitter to avoid perfect grid
    const baseLefts = Array.from({ length: count }).map((_, i) => (i + 0.5) * (100 / count));
    const shuffledIcons = [...ICONS].sort(() => Math.random() - 0.5);
    return baseLefts.map((base, i) => {
      const Icon = shuffledIcons[i % shuffledIcons.length];
      const jitter = (Math.random() - 0.5) * 6; // ±3%
      const left = Math.min(90, Math.max(10, base + jitter));
      const delay = Math.random() * 1.5; // 0-1.5s
      const duration = 2 + Math.random() * 1.5; // 2-3.5s
      const size = 20 + Math.random() * 24; // 20-44px
      return { Icon, delay, duration, left, size };
    });
  }, []);

  return (
    <section className="flex flex-col items-center gap-4 max-w-[280px]">
      {/* Stage */}
      <section className="relative w-[280px] h-[280px] border border-dashed rounded-lg overflow-hidden bg-card/80">
        {icons.map(({ Icon, delay, duration, left, size }, idx) => (
          <Icon
            key={idx}
            className="absolute text-muted-foreground"
            style={{
              left: `${left}%`,
              top: "-40px",
              width: size,
              height: size,
              animation: `wf-fall ${duration}s linear ${delay}s infinite`,
            }}
            aria-hidden="true"
          />
        ))}
        {/* Inline keyframes */}
        <style jsx>{`
          @keyframes wf-fall {
            0% {
              transform: translateY(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(320px);
              opacity: 0;
            }
          }
        `}</style>
      </section>
      {/* Changing helper text */}
      <p className="text-sm text-muted-foreground min-h-[1.25rem] transition-opacity duration-500" key={textIdx}>
        {TEXTS[textIdx]}
      </p>
    </section>
  );
}