"use client";

import type * as React from "react";
import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "rounded-md border border-border bg-popover text-popover-foreground text-sm",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
