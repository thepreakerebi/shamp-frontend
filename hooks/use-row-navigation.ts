"use client";
import { useRouter } from "next/navigation";
import { HTMLAttributes, useCallback } from "react";

/**
 * Hook that returns props to apply on a table <tr> (or any element)
 * so the entire row navigates to the provided href when clicked.
 * Call inside a client component.
 */
export function useRowNavigation(href: string): Pick<HTMLAttributes<HTMLElement>, "onClick" | "className" | "tabIndex" | "role"> {
  const router = useRouter();

  const handleClick = useCallback<NonNullable<HTMLAttributes<HTMLElement>["onClick"]>>(
    (e) => {
      // If the element triggered stopPropagation upstream, ignore.
      if (e.defaultPrevented) return;
      router.push(href);
    },
    [router, href]
  );

  return {
    onClick: handleClick,
    className: "cursor-pointer hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    tabIndex: 0,
    role: "link",
  };
} 