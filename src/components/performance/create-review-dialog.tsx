"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { createReviewAction } from "@/actions/performance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { idleFormState, type FormState } from "@/lib/form-state";

export function CreateReviewDialog({
  interns,
  defaultPeriodStart,
  defaultPeriodEnd,
  disabled,
}: {
  interns: { id: string; name: string }[];
  defaultPeriodStart: string;
  defaultPeriodEnd: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [internId, setInternId] = useState(interns[0]?.id ?? "");
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await createReviewAction(idleFormState, formData);
      setState(result);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled || interns.length === 0}>
          <Plus className="size-4" aria-hidden />
          Review baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat review performa</DialogTitle>
          <DialogDescription>
            Tentukan periode penilaian, lalu isi skor per kriteria.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="internId" value={internId} />

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-intern">Intern</Label>
            <Select value={internId} onValueChange={setInternId}>
              <SelectTrigger id="review-intern" aria-label="Pilih intern">
                <SelectValue placeholder="Pilih intern" />
              </SelectTrigger>
              <SelectContent>
                {interns.map((intern) => (
                  <SelectItem key={intern.id} value={intern.id}>
                    {intern.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={state.fieldErrors?.internId?.[0]} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="period-start">Periode mulai</Label>
              <Input
                id="period-start"
                name="periodStart"
                type="date"
                defaultValue={defaultPeriodStart}
                required
              />
              <FieldError message={state.fieldErrors?.periodStart?.[0]} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="period-end">Periode akhir</Label>
              <Input
                id="period-end"
                name="periodEnd"
                type="date"
                defaultValue={defaultPeriodEnd}
                required
              />
              <FieldError message={state.fieldErrors?.periodEnd?.[0]} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="review-summary">Ringkasan (opsional)</Label>
            <Textarea id="review-summary" name="summary" rows={3} maxLength={5000} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Membuat..." : "Buat review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
