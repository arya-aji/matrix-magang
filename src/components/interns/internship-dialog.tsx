"use client";

import { Plus, SquarePen } from "lucide-react";
import { useState } from "react";

import { createInternshipAction, updateInternshipAction } from "@/actions/internships";
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
import { toast } from "@/components/ui/sonner";
import { INTERNSHIP_STATUSES, INTERNSHIP_STATUS_LABELS } from "@/lib/constants";
import { idleFormState, type FormState } from "@/lib/form-state";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export type InternshipValue = {
  id: string;
  userId: string;
  name: string;
  departmentId: string | null;
  startDate: string;
  endDate: string;
  status: string;
};

export function InternshipDialog({
  internship,
  interns = [],
  departments,
}: {
  internship?: InternshipValue;
  interns?: { id: string; name: string; email: string }[];
  departments: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(internship);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = isEdit
        ? await updateInternshipAction(idleFormState, formData)
        : await createInternshipAction(idleFormState, formData);
      setState(result);
      if (result.ok) {
        toast.success(isEdit ? "Data magang diperbarui." : "Data magang dibuat.");
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
          <Button variant="ghost" size="sm" aria-label={`Edit magang ${internship?.name}`}>
            <SquarePen className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            Intern baru
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit data magang" : "Data magang baru"}</DialogTitle>
          <DialogDescription>
            Tetapkan periode magang dan departemen intern.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4" noValidate>
          {internship ? (
            <>
              <input type="hidden" name="internshipId" value={internship.id} />
              <input type="hidden" name="userId" value={internship.userId} />
              <div className="flex flex-col gap-2">
                <Label>Intern</Label>
                <p className="text-sm font-medium">{internship.name}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="internship-user">Intern</Label>
              <select id="internship-user" name="userId" required className={selectClass}>
                <option value="">Pilih intern…</option>
                {interns.map((intern) => (
                  <option key={intern.id} value={intern.id}>
                    {intern.name} — {intern.email}
                  </option>
                ))}
              </select>
              <FieldError message={state.fieldErrors?.userId?.[0]} />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="internship-department">Departemen</Label>
            <select
              id="internship-department"
              name="departmentId"
              defaultValue={internship?.departmentId ?? ""}
              className={selectClass}
            >
              <option value="">Tanpa departemen</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="internship-start">Mulai</Label>
              <Input
                id="internship-start"
                name="startDate"
                type="date"
                defaultValue={internship?.startDate}
                required
              />
              <FieldError message={state.fieldErrors?.startDate?.[0]} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="internship-end">Selesai</Label>
              <Input
                id="internship-end"
                name="endDate"
                type="date"
                defaultValue={internship?.endDate}
                required
              />
              <FieldError message={state.fieldErrors?.endDate?.[0]} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="internship-status">Status</Label>
            <select
              id="internship-status"
              name="status"
              defaultValue={internship?.status ?? "ACTIVE"}
              className={selectClass}
            >
              {INTERNSHIP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {INTERNSHIP_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Menyimpan…" : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
