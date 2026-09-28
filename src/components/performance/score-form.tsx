"use client";

import { useActionState, useEffect, useState } from "react";

import { saveReviewScoreAction } from "@/actions/performance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { idleFormState } from "@/lib/form-state";

export function ScoreForm({
  reviewId,
  criterionId,
  criterionName,
  criterionWeight,
  score,
  comment,
  disabled,
}: {
  reviewId: string;
  criterionId: string;
  criterionName: string;
  criterionWeight: number;
  score: number | null;
  comment: string | null;
  disabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveReviewScoreAction, idleFormState);
  const [value, setValue] = useState(String(score ?? 3));

  useEffect(() => {
    if (state.ok) toast.success(`Nilai ${criterionName} tersimpan.`);
  }, [state, criterionName]);

  const numericScore = Number(value);
  const contribution = ((numericScore / 5) * criterionWeight).toFixed(2);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-b border-border pb-4 last:border-0">
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="criterionId" value={criterionId} />
      <input type="hidden" name="score" value={value} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{criterionName}</p>
          <p className="text-xs text-muted-foreground">
            Bobot {criterionWeight} · kontribusi {contribution}
          </p>
        </div>

        <div className="w-28">
          <Label htmlFor={`score-${criterionId}`} className="sr-only">
            Nilai {criterionName}
          </Label>
          <Select value={value} onValueChange={setValue} disabled={disabled}>
            <SelectTrigger id={`score-${criterionId}`} aria-label={`Nilai ${criterionName}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} / 5
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`comment-${criterionId}`}>Komentar (opsional)</Label>
        <Textarea
          id={`comment-${criterionId}`}
          name="comment"
          rows={2}
          maxLength={2000}
          defaultValue={comment ?? ""}
          disabled={disabled}
          placeholder="Jelaskan alasan nilai ini"
        />
        <FieldError message={state.fieldErrors?.comment?.[0]} />
      </div>

      {!disabled ? (
        <Button type="submit" size="sm" variant="outline" disabled={pending} className="self-start">
          {pending ? "Menyimpan..." : "Simpan nilai"}
        </Button>
      ) : null}
    </form>
  );
}
