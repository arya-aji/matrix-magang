"use client";

import { useState } from "react";

import { updateTaskProgressAction } from "@/actions/tasks";
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
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { idleFormState, type FormState } from "@/lib/form-state";
import type { TaskStatus } from "@/db/schema";

export function TaskProgressForm({
  taskId,
  progress,
  status,
  canChangeStatus,
}: {
  taskId: string;
  progress: number;
  status: TaskStatus;
  canChangeStatus: boolean;
}) {
  const [value, setValue] = useState(progress);
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(status);
  const [state, setState] = useState<FormState>(idleFormState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      const result = await updateTaskProgressAction(idleFormState, formData);
      setState(result);
      if (result.ok) toast.success("Progress diperbarui.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="progress" value={value} />
      {canChangeStatus ? (
        <input type="hidden" name="status" value={currentStatus} />
      ) : null}

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="progress-slider">Progress</Label>
          <span className="text-sm font-medium tabular-nums">{value}%</span>
        </div>
        <Slider
          id="progress-slider"
          aria-label="Progress"
          value={[value]}
          max={100}
          step={5}
          onValueChange={(next) => setValue(next[0] ?? 0)}
        />
        <FieldError message={state.fieldErrors?.progress?.[0]} />
      </div>

      {canChangeStatus ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={currentStatus}
            onValueChange={(next) => setCurrentStatus(next as TaskStatus)}
          >
            <SelectTrigger id="status" aria-label="Pilih status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {TASK_STATUS_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={state.fieldErrors?.status?.[0]} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="comment">Komentar (opsional)</Label>
        <Textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={2000}
          placeholder="Catatan singkat mengenai progres"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Update Progress"}
      </Button>
    </form>
  );
}
