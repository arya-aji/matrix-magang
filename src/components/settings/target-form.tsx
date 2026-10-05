"use client";

import { useState } from "react";

import { updateSettingsAction } from "@/actions/settings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { idleFormState, type FormState } from "@/lib/form-state";

export function TargetForm({ dailyTarget }: { dailyTarget: number }) {
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await updateSettingsAction(idleFormState, formData);
      setState(result);
      if (result.ok) toast.success("Target harian disimpan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="daily-target">Target entri harian (per intern)</Label>
        <Input
          id="daily-target"
          name="dailyTarget"
          type="number"
          min={1}
          max={10000}
          defaultValue={dailyTarget}
          required
        />
        <FieldError message={state.fieldErrors?.dailyTarget?.[0]} />
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Menyimpan…" : "Simpan target"}
      </Button>
    </form>
  );
}
