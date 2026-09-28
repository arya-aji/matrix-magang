"use client";

import { Plus, SquarePen } from "lucide-react";
import { useState } from "react";

import { saveCriterionAction } from "@/actions/performance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { idleFormState, type FormState } from "@/lib/form-state";

export type CriterionFormValue = {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  isActive: boolean;
};

export function CriterionDialog({ criterion }: { criterion?: CriterionFormValue }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(criterion);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await saveCriterionAction(idleFormState, formData);
      setState(result);
      if (result.ok) {
        toast.success(isEdit ? "Kriteria diperbarui." : "Kriteria ditambahkan.");
        setOpen(false);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" aria-label={`Edit ${criterion?.name}`}>
            <SquarePen className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            Kriteria baru
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit kriteria" : "Kriteria baru"}</DialogTitle>
          <DialogDescription>
            Total bobot semua kriteria aktif harus sama dengan 100.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
          {criterion ? <input type="hidden" name="id" value={criterion.id} /> : null}

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="criterion-name">Nama</Label>
            <Input
              id="criterion-name"
              name="name"
              required
              maxLength={100}
              defaultValue={criterion?.name}
              placeholder="Contoh: Task Completion"
            />
            <FieldError message={state.fieldErrors?.name?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="criterion-description">Deskripsi</Label>
            <Textarea
              id="criterion-description"
              name="description"
              rows={2}
              maxLength={2000}
              defaultValue={criterion?.description ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="criterion-weight">Bobot</Label>
            <Input
              id="criterion-weight"
              name="weight"
              type="number"
              min={0}
              max={100}
              required
              defaultValue={criterion?.weight ?? 0}
            />
            <FieldError message={state.fieldErrors?.weight?.[0]} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="criterion-active"
              name="isActive"
              value="true"
              defaultChecked={criterion?.isActive ?? true}
            />
            <Label htmlFor="criterion-active" className="font-normal">
              Aktif
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
