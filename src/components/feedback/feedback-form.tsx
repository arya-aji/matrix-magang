"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createFeedbackAction } from "@/actions/feedback";
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

export function FeedbackForm({
  internId,
  taskId,
  label = "Beri feedback",
  internOptions,
}: {
  internId: string;
  taskId?: string;
  label?: string;
  /** When a task has several assignees, the reviewer picks who the feedback is for. */
  internOptions?: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createFeedbackAction, idleFormState);
  const [targetInternId, setTargetInternId] = useState(internId);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Feedback terkirim.");
      formRef.current?.reset();
    }
  }, [state]);

  const showTargetPicker = (internOptions?.length ?? 0) > 1;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="internId" value={targetInternId} />
      {taskId ? <input type="hidden" name="taskId" value={taskId} /> : null}

      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {showTargetPicker ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`feedback-target-${taskId ?? internId}`}>Untuk intern</Label>
          <Select value={targetInternId} onValueChange={setTargetInternId}>
            <SelectTrigger
              id={`feedback-target-${taskId ?? internId}`}
              aria-label="Pilih intern penerima feedback"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {internOptions?.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor={`feedback-${taskId ?? internId}`}>{label}</Label>
        <Textarea
          id={`feedback-${taskId ?? internId}`}
          name="content"
          rows={3}
          maxLength={5000}
          required
          placeholder="Tulis masukan yang konstruktif untuk intern..."
          aria-invalid={state.fieldErrors?.content ? true : undefined}
        />
        <FieldError message={state.fieldErrors?.content?.[0]} />
      </div>

      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Mengirim..." : "Kirim feedback"}
      </Button>
    </form>
  );
}
