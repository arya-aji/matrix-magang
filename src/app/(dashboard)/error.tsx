"use client";

import { CircleAlert } from "lucide-react";
import { useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface only the digest — never dump internals into the UI (PRD §46).
    console.error("dashboard.error", error.digest);
  }, [error]);

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive">
        <CircleAlert aria-hidden />
        <AlertTitle>Terjadi kesalahan</AlertTitle>
        <AlertDescription>
          Kami tidak dapat memuat halaman ini. Silakan coba lagi.
          {error.digest ? ` (ref: ${error.digest.slice(0, 8)})` : ""}
        </AlertDescription>
      </Alert>

      <Button onClick={reset} className="self-start">
        Coba lagi
      </Button>
    </div>
  );
}
