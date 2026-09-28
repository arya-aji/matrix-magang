import { ActivityStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/date";
import type { DailyActivity } from "@/db/schema";
import { cn } from "@/lib/utils";

export function ActivityCard({
  activity,
  internName,
  className,
}: {
  activity: Pick<
    DailyActivity,
    "id" | "summary" | "progress" | "blocker" | "nextStep" | "status" | "submittedAt" | "activityDate" | "updatedAt"
  >;
  internName?: string;
  className?: string;
}) {
  return (
    <Card className={cn("gap-2 py-4", className)}>
      <CardContent className="flex flex-col gap-2 px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            {internName ? (
              <p className="font-medium">{internName}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">{formatDate(activity.activityDate)}</p>
          </div>
          <ActivityStatusBadge status={activity.status} />
        </div>

        <p className="text-sm whitespace-pre-wrap">{activity.summary}</p>

        {activity.progress !== null ? (
          <p className="text-xs text-muted-foreground">Progress dilaporkan: {activity.progress}%</p>
        ) : null}

        {activity.blocker ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="text-xs font-medium text-destructive">Blocker</p>
            <p className="text-sm text-foreground/90">{activity.blocker}</p>
          </div>
        ) : null}

        {activity.nextStep ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Rencana selanjutnya</p>
            <p className="text-sm text-foreground/90">{activity.nextStep}</p>
          </div>
        ) : null}

        {activity.submittedAt ? (
          <p className="text-xs text-muted-foreground">
            Dikirim {formatDateTime(activity.submittedAt)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
