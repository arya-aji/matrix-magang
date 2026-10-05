"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";

import { createEntryAction } from "@/actions/entries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { ENTRY_KINDS, ENTRY_KIND_LABELS } from "@/lib/constants";
import { idleFormState, type FormState } from "@/lib/form-state";

/**
 * Fast, repeatable entry form: type a name, pick Usaha/Keluarga, submit. The
 * form resets after each save so a whole list can be entered without leaving
 * the page.
 */
export function EntryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await createEntryAction(idleFormState, formData);
      setState(result);
      if (result.ok) {
        toast.success("Entri tersimpan.");
        formRef.current?.reset();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border p-3"
      noValidate
    >
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="entry-name">Nama</Label>
        <Input
          id="entry-name"
          name="name"
          placeholder="Nama usaha atau nama keluarga"
          autoComplete="off"
          maxLength={200}
          required
        />
        <FieldError message={state.fieldErrors?.name?.[0]} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="entry-kind">Jenis</Label>
        <select
          id="entry-kind"
          name="kind"
          defaultValue="USAHA"
          required
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {ENTRY_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {ENTRY_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.kind?.[0]} />
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Tambah catatan (opsional)</summary>
        <div className="mt-2 flex flex-col gap-2">
          <Textarea name="note" rows={2} placeholder="Catatan opsional…" maxLength={2000} />
        </div>
      </details>

      <Button type="submit" disabled={pending} className="w-full">
        <Plus className="size-4" aria-hidden />
        {pending ? "Menyimpan…" : "Tambah entri"}
      </Button>
    </form>
  );
}
