import { ArrowLeft, CalendarClock, ClipboardList, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EditTaskDialog, DeleteTaskButton } from "@/components/tasks/task-dialogs";
import { TaskProgressForm } from "@/components/tasks/task-progress-form";
import { TaskTimeline } from "@/components/tasks/task-timeline";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { ProgressBar } from "@/components/shared/progress-bar";
import { OverdueBadge, PriorityBadge, TaskStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime, isOverdue } from "@/lib/date";
import { requireAuth } from "@/server/auth/session";
import { guard } from "@/server/permissions/guard";
import {
  getAssignableInterns,
  getTaskFeedback,
  getTaskForUser,
  getTaskTimeline,
} from "@/server/queries/tasks";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const user = await requireAuth();
  const { taskId } = await params;

  const task = await guard(() => getTaskForUser(user, taskId));
  if (!task) notFound();

  const [timeline, feedbackEntries, interns] = await Promise.all([
    getTaskTimeline(task.id),
    getTaskFeedback(task.id),
    user.role === "INTERN" ? Promise.resolve([]) : getAssignableInterns(user),
  ]);

  const isOwner = task.assignees.some((assignee) => assignee.id === user.id);
  const isStaff = user.role === "ADMIN" || user.role === "MENTOR";
  const canUpdateProgress = isStaff || isOwner;
  const canEditDetails = isStaff;
  const canFeedback = isStaff;
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/tasks">
            <ArrowLeft className="size-4" aria-hidden />
            Kembali
          </Link>
        </Button>
      </div>

      <header className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{task.title}</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <TaskStatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {overdue ? <OverdueBadge /> : null}
        </div>
        <ProgressBar value={task.progress} label="Progress" />
      </header>

      <section className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Deskripsi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-foreground/90">
              {task.description || "Belum ada deskripsi."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">
                Assignee{task.assignees.length > 1 ? ` (${task.assignees.length})` : ""}
              </span>
              <span className="text-right">
                {task.assignees.length > 0
                  ? task.assignees.map((assignee) => assignee.name).join(", ")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Dibuat oleh</span>
              <span className="text-right">{task.createdByName}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Mulai</span>
              <span className="text-right">{formatDate(task.startDate)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Tenggat</span>
              <span className="text-right">{formatDate(task.dueDate)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Selesai pada</span>
              <span className="text-right">
                {task.completedAt ? formatDateTime(task.completedAt) : "-"}
              </span>
            </div>
            {canEditDetails ? (
              <div className="flex flex-wrap gap-2 pt-2">
                <EditTaskDialog
                  interns={interns}
                  task={{
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    assigneeIds: task.assignees.map((assignee) => assignee.id),
                    priority: task.priority,
                    startDate: task.startDate,
                    dueDate: task.dueDate,
                  }}
                />
                <DeleteTaskButton taskId={task.id} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {canUpdateProgress ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Update progress</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskProgressForm
              taskId={task.id}
              progress={task.progress}
              status={task.status}
              canChangeStatus
            />
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="size-4" aria-hidden />
          Timeline
        </h2>
        <TaskTimeline entries={timeline} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="size-4" aria-hidden />
          Feedback
        </h2>
        <FeedbackList
          entries={feedbackEntries.map((entry) => ({
            id: entry.id,
            content: entry.content,
            createdAt: entry.createdAt,
            authorName: entry.authorName,
            authorRole: entry.authorRole,
          }))}
        />
        {canFeedback ? (
          <Card>
            <CardContent className="pt-5">
              <FeedbackForm
                internId={task.assignees[0]?.id ?? ""}
                taskId={task.id}
                label="Tambah feedback"
                internOptions={task.assignees}
              />
            </CardContent>
          </Card>
        ) : null}
      </section>

      {canEditDetails ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList className="size-3.5" aria-hidden />
          Perubahan status dan progress tercatat otomatis pada timeline.
        </p>
      ) : null}
    </div>
  );
}
