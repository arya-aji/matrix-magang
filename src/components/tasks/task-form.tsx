"use client";

import { useActionState, useEffect, useState } from "react";

import { createTaskAction, updateTaskAction } from "@/actions/tasks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/constants";
import { idleFormState } from "@/lib/form-state";
import { toast } from "@/components/ui/sonner";
import type { TaskPriority } from "@/db/schema";

export type TaskFormTask = {
  id: string;
  title: string;
  description: string | null;
  assigneeIds: string[];
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
};

export function TaskForm({
  interns,
  task,
  onSuccess,
  onCancel,
}: {
  interns: { id: string; name: string }[];
  task?: TaskFormTask;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(task);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateTaskAction : createTaskAction,
    idleFormState,
  );
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "MEDIUM");

  useEffect(() => {
    if (state.ok && isEdit) {
      toast.success("Tugas diperbarui.");
      onSuccess?.();
    }
  }, [state, isEdit, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {task ? <input type="hidden" name="taskId" value={task.id} /> : null}
      <input type="hidden" name="priority" value={priority} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Judul</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={task?.title}
          placeholder="Contoh: Build Login Page"
          aria-invalid={state.fieldErrors?.title ? true : undefined}
        />
        <FieldError message={state.fieldErrors?.title?.[0]} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={5000}
          defaultValue={task?.description ?? ""}
          placeholder="Detail pekerjaan, kriteria selesai, dsb."
        />
        <FieldError message={state.fieldErrors?.description?.[0]} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm leading-none font-medium">
          Assignee — bisa lebih dari satu orang
        </legend>
        <div className="mt-1 flex max-h-52 flex-col gap-2.5 overflow-y-auto rounded-md border border-input p-3">
          {interns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada intern yang tersedia.</p>
          ) : (
            interns.map((intern, index) => (
              <div key={intern.id} className="flex items-center gap-2">
                <Checkbox
                  id={`assignee-${intern.id}`}
                  name="assigneeIds"
                  value={intern.id}
                  defaultChecked={
                    isEdit ? Boolean(task?.assigneeIds.includes(intern.id)) : index === 0
                  }
                />
                <Label htmlFor={`assignee-${intern.id}`} className="font-normal">
                  {intern.name}
                </Label>
              </div>
            ))
          )}
        </div>
        <FieldError message={state.fieldErrors?.assigneeIds?.[0]} />
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="priority">Prioritas</Label>
        <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
          <SelectTrigger id="priority" aria-label="Pilih prioritas">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_PRIORITIES.map((value) => (
              <SelectItem key={value} value={value}>
                {TASK_PRIORITY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Tanggal mulai</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={task?.startDate ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dueDate">Tenggat</Label>
          <Input id="dueDate" name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} />
          <FieldError message={state.fieldErrors?.dueDate?.[0]} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Buat tugas"}
        </Button>
      </div>
    </form>
  );
}
