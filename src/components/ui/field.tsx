import type * as React from "react";

import { cn } from "@/lib/utils";

export function FieldError({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p role="alert" className={cn("text-sm font-medium text-destructive", className)}>
      {message}
    </p>
  );
}

export function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}
