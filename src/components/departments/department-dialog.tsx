"use client";

import { Plus, SquarePen } from "lucide-react";
import { useState } from "react";

import { saveDepartmentAction } from "@/actions/departments";
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

export type DepartmentValue = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export function DepartmentDialog({ department }: { department?: DepartmentValue }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(department);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await saveDepartmentAction(idleFormState, formData);
      setState(result);
      if (result.ok) {
        toast.success(isEdit ? "Departemen diperbarui." : "Departemen ditambahkan.");
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
          <Button variant="ghost" size="sm" aria-label={`Edit ${department?.name}`}>
            <SquarePen className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            Departemen baru
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit departemen" : "Departemen baru"}</DialogTitle>
          <DialogDescription>Departemen membantu mengelompokkan intern.</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
          {department ? <input type="hidden" name="id" value={department.id} /> : null}

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="department-name">Nama</Label>
            <Input
              id="department-name"
              name="name"
              required
              maxLength={120}
              defaultValue={department?.name}
            />
            <FieldError message={state.fieldErrors?.name?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="department-description">Deskripsi</Label>
            <Textarea
              id="department-description"
              name="description"
              rows={2}
              maxLength={2000}
              defaultValue={department?.description ?? ""}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="department-active"
              name="isActive"
              value="true"
              defaultChecked={department?.isActive ?? true}
            />
            <Label htmlFor="department-active" className="font-normal">
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
