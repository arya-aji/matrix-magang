import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityCard } from "@/components/activities/activity-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/server/auth/session";
import { assertCanViewIntern } from "@/server/permissions";
import { guard } from "@/server/permissions/guard";
import { getActivityById, getActivityTasks } from "@/server/queries/activities";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const user = await requireAuth();
  const { activityId } = await params;

  const activity = await guard(async () => {
    const row = await getActivityById(activityId);
    if (!row) return null;
    await assertCanViewIntern(user, row.internId);
    return row;
  });

  if (!activity) notFound();

  const tasks = await getActivityTasks(activity.id);

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/activity">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </Link>
      </Button>

      <h1 className="text-xl font-semibold tracking-tight">Detail aktivitas</h1>

      <ActivityCard activity={activity} internName={activity.internName} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pekerjaan yang dikerjakan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 text-sm">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada pekerjaan tertaut.</p>
          ) : (
            tasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="hover:underline">
                • {task.title}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
