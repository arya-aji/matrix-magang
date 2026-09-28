"use client";

import { useActionState, useEffect } from "react";

import { finalizeReviewAction } from "@/actions/performance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { idleFormState } from "@/lib/form-state";

export function FinalizeReviewForm({
  reviewId,
  summary,
}: {
  reviewId: string;
  summary: string | null;
}) {
  const [state, formAction, pending] = useActionState(finalizeReviewAction, idleFormState);

  useEffect(() => {
    if (state.ok) toast.success("Review difinalisasi.");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="reviewId" value={reviewId} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="review-summary-final">Ringkasan penilaian</Label>
        <Textarea
          id="review-summary-final"
          name="summary"
          rows={3}
          maxLength={5000}
          defaultValue={summary ?? ""}
          placeholder="Ringkas pencapaian dan area pengembangan intern."
        />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Memfinalisasi..." : "Finalisasi review"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Setelah difinalisasi, review menjadi read-only dan skor dihitung ulang di server.
      </p>
    </form>
  );
}
