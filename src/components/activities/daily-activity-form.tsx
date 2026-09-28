"use client";

import { X } from "lucide-react";
import { useActionState, useState } from "react";

import { saveDailyActivityAction } from "@/actions/activities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Collapsible } from "@/components/shared/collapsible";
import type { TaskStatus } from "@/db/schema";
import { idleFormState } from "@/lib/form-state";

type TaskOption = { id: string; title: string; status?: TaskStatus };

/** Only surface status when it changes how the intern should report the work. */
function optionLabel(task: TaskOption): string {
  if (task.status === "COMPLETED") return `${task.title} · Selesai`;
  if (task.status === "BLOCKED") return `${task.title} · Terhambat`;
  return task.title;
}

export type DailyActivityDefaults = {
  id?: string;
  /** Mentor-assigned tasks already logged for this activity. */
  taskIds: string[];
  summary: string | null;
  progress: number | null;
  blocker: string | null;
  nextStep: string | null;
  status: "DRAFT" | "SUBMITTED";
};

export function DailyActivityForm({
  defaults,
  taskOptions,
}: {
  defaults: DailyActivityDefaults;
  /** The work items are set by the mentor; the intern just picks one. */
  taskOptions: TaskOption[];
}) {
  const [state, formAction, pending] = useActionState(saveDailyActivityAction, idleFormState);
  const [progress, setProgress] = useState(defaults.progress ?? 0);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(defaults.taskIds);

  const availableTasks = taskOptions.filter((task) => !selectedTaskIds.includes(task.id));
  const selectedTasks = selectedTaskIds
    .map((id) => taskOptions.find((task) => task.id === id))
    .filter((task): task is TaskOption => Boolean(task));

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <input type="hidden" name="progress" value={progress} />
      {selectedTaskIds.map((taskId) => (
        <input key={taskId} type="hidden" name="taskIds" value={taskId} />
      ))}

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.ok ? (
        <Alert>
          <AlertDescription>
            Tersimpan. Bisa tambah pekerjaan lain kalau perlu.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="work-picker">Pekerjaan hari ini</Label>
        <p className="text-xs text-muted-foreground">
          Pekerjaan diatur oleh mentor — Anda cukup memilih dari daftar.
        </p>

        {taskOptions.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
            Mentor belum menugaskan pekerjaan untuk Anda.
          </p>
        ) : (
          <Select
            key={selectedTaskIds.join(",")}
            onValueChange={(value) =>
              setSelectedTaskIds((current) => [...current, value])
            }
          >
            <SelectTrigger id="work-picker" aria-label="Pilih pekerjaan dari mentor">
              <SelectValue placeholder="Pilih pekerjaan..." />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.length === 0 ? (
                <SelectItem value="__all_selected" disabled>
                  Semua pekerjaan sudah dipilih
                </SelectItem>
              ) : (
                availableTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {optionLabel(task)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}

        {selectedTasks.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {selectedTasks.map((task) => (
              <Badge key={task.id} variant="secondary" className="gap-1">
                {task.title}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTaskIds((current) =>
                      current.filter((id) => id !== task.id),
                    )
                  }
                  aria-label={`Hapus ${task.title}`}
                  className="rounded-full transition-colors hover:text-destructive"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <FieldError message={state.fieldErrors?.taskIds?.[0]} />
      </div>

      <Collapsible summary="Tambah detail (opsional)">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="activity-progress">Progress</Label>
              <span className="text-sm tabular-nums">{progress}%</span>
            </div>
            <Slider
              id="activity-progress"
              aria-label="Progress"
              value={[progress]}
              max={100}
              step={5}
              onValueChange={(next) => setProgress(next[0] ?? 0)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="blocker">Blocker</Label>
            <Textarea
              id="blocker"
              name="blocker"
              rows={2}
              maxLength={2000}
              defaultValue={defaults.blocker ?? ""}
              placeholder="Contoh: Menunggu API credentials"
            />
            <FieldError message={state.fieldErrors?.blocker?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="summary">Catatan</Label>
            <Textarea
              id="summary"
              name="summary"
              rows={2}
              maxLength={5000}
              defaultValue={defaults.summary ?? ""}
              placeholder="Contoh: Implemented login validation..."
              aria-invalid={state.fieldErrors?.summary ? true : undefined}
            />
            <FieldError message={state.fieldErrors?.summary?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nextStep">Rencana selanjutnya</Label>
            <Textarea
              id="nextStep"
              name="nextStep"
              rows={2}
              maxLength={2000}
              defaultValue={defaults.nextStep ?? ""}
              placeholder="Contoh: Menyelesaikan integrasi API"
            />
            <FieldError message={state.fieldErrors?.nextStep?.[0]} />
          </div>
        </div>
      </Collapsible>

      <div className="flex flex-col gap-1.5">
        <Button
          type="submit"
          name="submit"
          value="1"
          size="lg"
          disabled={pending}
          className="w-full"
        >
          {pending ? "Mengirim..." : "Kirim"}
        </Button>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          className="w-full text-muted-foreground"
        >
          {pending ? "Menyimpan..." : "Simpan sebagai draft"}
        </Button>
      </div>
    </form>
  );
}
