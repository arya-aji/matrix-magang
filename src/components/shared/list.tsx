import Link from "next/link";
import type * as React from "react";

import { cn } from "@/lib/utils";

/** Bordered container that turns stacked content into one dense list. */
export function ListCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      {children}
    </div>
  );
}

export function ListRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Flexible middle column: truncating title + optional meta line. */
export function ListRowMain({
  title,
  meta,
  className,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <div className="truncate text-sm font-medium">{title}</div>
      {meta ? <div className="truncate text-xs text-muted-foreground">{meta}</div> : null}
    </div>
  );
}

/** Section heading with an optional "see all" style action. */
export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Small "Lihat semua" link used at the end of compact sections. */
export function SectionLink({ href, label = "Lihat semua" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="text-xs font-medium text-primary hover:underline">
      {label} →
    </Link>
  );
}
