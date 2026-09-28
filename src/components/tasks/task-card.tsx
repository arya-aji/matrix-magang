import Link from "next/link";

import { OverdueBadge, PriorityBadge, TaskStatusBadge } from "@/components/shared/status-badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, isOverdue } from "@/lib/date";
import type { TaskListItem } from "@/server/queries/tasks";

export function assigneeLabel(
  assignees: { id: string; name: string }[],
): string {
  if (assignees.length === 0) return "Belum ada assignee";
  if (assignees.length <= 2) return assignees.map((a) => a.name).join(", ");
  return `${assignees[0]?.name} +${assignees.length - 1} lainnya`;
}

export function TaskCard({
  task,
  showAssignees = true,
}: {
  task: TaskListItem;
  showAssignees?: boolean;
}) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Card className="gap-2 py-4">
      <CardContent className="flex flex-col gap-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/tasks/${task.id}`}
            className="font-medium leading-snug hover:underline"
          >
            {task.title}
          </Link>
          <PriorityBadge priority={task.priority} />
        </div>

        {showAssignees ? (
          <p className="text-xs text-muted-foreground" title={task.assignees.map((a) => a.name).join(", ")}>
            {assigneeLabel(task.assignees)}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          <TaskStatusBadge status={task.status} />
          {overdue ? <OverdueBadge /> : null}
        </div>

        <ProgressBar value={task.progress} label="Progress" />

        <p className="text-xs text-muted-foreground">
          Tenggat: {task.dueDate ? formatDate(task.dueDate) : "Belum ditentukan"}
        </p>
      </CardContent>
    </Card>
  );
}

export function TaskCardList({
  tasks,
  showAssignees = true,
}: {
  tasks: TaskListItem[];
  showAssignees?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} showAssignees={showAssignees} />
      ))}
    </div>
  );
}

export function TaskTable({
  tasks,
  showAssignees = true,
}: {
  tasks: TaskListItem[];
  showAssignees?: boolean;
}) {
  return (
    <div className="hidden rounded-lg border border-border md:block">
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b border-border">
          <tr>
            <th className="h-10 px-3 text-left text-xs font-medium text-muted-foreground">
              Tugas
            </th>
            {showAssignees ? (
              <th className="h-10 px-3 text-left text-xs font-medium text-muted-foreground">
                Assignee
              </th>
            ) : null}
            <th className="h-10 px-3 text-left text-xs font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-10 px-3 text-left text-xs font-medium text-muted-foreground">
              Progress
            </th>
            <th className="h-10 px-3 text-left text-xs font-medium text-muted-foreground">
              Tenggat
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status);

            return (
              <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                <td className="p-3">
                  <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                </td>
                {showAssignees ? (
                  <td
                    className="max-w-48 truncate p-3 text-muted-foreground"
                    title={task.assignees.map((a) => a.name).join(", ")}
                  >
                    {assigneeLabel(task.assignees)}
                  </td>
                ) : null}
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <TaskStatusBadge status={task.status} />
                    {overdue ? <OverdueBadge /> : null}
                  </div>
                </td>
                <td className="w-40 p-3">
                  <ProgressBar value={task.progress} showValue />
                </td>
                <td className="p-3 text-muted-foreground">
                  {task.dueDate ? formatDate(task.dueDate) : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
