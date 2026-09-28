import { ChevronDown } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Progressive disclosure without any client JavaScript: a native
 * `<details>`/`<summary>` that is keyboard accessible by default.
 * Used to keep secondary detail off the first screen.
 */
export function Collapsible({
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn("group overflow-hidden rounded-lg border border-border bg-card", className)}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium",
          "hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="min-w-0">{summary}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="border-t border-border px-3 py-2.5">{children}</div>
    </details>
  );
}
