import { ClipboardList } from "lucide-react";

import { CreateTaskDialog } from "@/components/tasks/task-dialogs";
import { TaskCardList, TaskTable } from "@/components/tasks/task-card";
import { TaskFilters } from "@/components/tasks/task-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { readNumber, readString, type SearchParams } from "@/lib/search-params";
import { requireAuth } from "@/server/auth/session";
import { guard } from "@/server/permissions/guard";
import { getAssignableInterns, getTasksForUser } from "@/server/queries/tasks";
import type { TaskPriority, TaskStatus } from "@/db/schema";

const STATUS_VALUES: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "COMPLETED"];
const PRIORITY_VALUES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

function parseStatus(value?: string): TaskStatus | undefined {
  return STATUS_VALUES.find((status) => status === value);
}

function parsePriority(value?: string): TaskPriority | undefined {
  return PRIORITY_VALUES.find((priority) => priority === value);
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const showAssignees = user.role !== "INTERN";

  const filters = {
    q: readString(params.q),
    status: parseStatus(readString(params.status)),
    priority: parsePriority(readString(params.priority)),
    assigneeId: readString(params.assigneeId),
    dueBefore: readString(params.dueBefore),
    page: readNumber(params.page),
  };

  const [result, interns] = await Promise.all([
    guard(() => getTasksForUser(user, filters)),
    getAssignableInterns(user),
  ]);

  const activeFilterCount = [
    filters.q,
    filters.status,
    filters.priority,
    filters.assigneeId,
    filters.dueBefore,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tasks"
        description={`${result.total} tugas${activeFilterCount > 0 ? ` · ${activeFilterCount} filter aktif` : ""}`}
        actions={
          user.role === "INTERN" ? null : (
            <CreateTaskDialog interns={interns} disabled={interns.length === 0} />
          )
        }
      />

      {user.role === "INTERN" ? null : (
        <TaskFilters
          interns={interns}
          showAssignees={showAssignees}
          current={{
            q: filters.q,
            status: filters.status,
            priority: filters.priority,
            assigneeId: filters.assigneeId,
            dueBefore: filters.dueBefore,
          }}
        />
      )}

      {result.items.length === 0 ? (
        <EmptyState
          title="Belum ada tugas"
          description={
            user.role === "INTERN"
              ? "Mentor Anda belum menugaskan tugas."
              : "Buat tugas pertama untuk intern Anda."
          }
          icon={<ClipboardList className="size-5" aria-hidden />}
        />
      ) : (
        <>
          <TaskCardList tasks={result.items} showAssignees={showAssignees} />
          <TaskTable tasks={result.items} showAssignees={showAssignees} />
        </>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/tasks"
        params={{
          q: filters.q,
          status: filters.status,
          priority: filters.priority,
          assigneeId: filters.assigneeId,
          dueBefore: filters.dueBefore,
        }}
      />
    </div>
  );
}

