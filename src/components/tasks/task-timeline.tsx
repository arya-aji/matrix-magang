import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/date";
import type { TaskLogType } from "@/db/schema";

const typeLabels: Record<TaskLogType, string> = {
  CREATED: "Dibuat",
  STATUS_CHANGED: "Status berubah",
  PROGRESS_CHANGED: "Progress berubah",
  COMMENTED: "Komentar",
  COMPLETED: "Selesai",
};

export function TaskTimeline({
  entries,
}: {
  entries: {
    id: string;
    type: TaskLogType;
    oldValue: string | null;
    newValue: string | null;
    description: string | null;
    createdAt: Date;
    actorName: string;
  }[];
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada aktivitas pada tugas ini.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <span
            aria-hidden
            className="mt-1.5 size-2 shrink-0 rounded-full bg-border"
          />
          <Card className="flex-1 gap-1 py-3">
            <CardContent className="px-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-sm font-medium">{typeLabels[entry.type]}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
              {entry.oldValue !== null || entry.newValue !== null ? (
                <p className="text-xs text-muted-foreground">
                  {entry.oldValue ?? "-"} → {entry.newValue ?? "-"}
                </p>
              ) : null}
              {entry.description ? (
                <p className="text-sm text-foreground/90">{entry.description}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">oleh {entry.actorName}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}
