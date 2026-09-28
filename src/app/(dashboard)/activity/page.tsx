import { CalendarCheck } from "lucide-react";
import Link from "next/link";

import { DailyActivityForm } from "@/components/activities/daily-activity-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard, ListRow, ListRowMain, SectionHeader } from "@/components/shared/list";
import { Pagination } from "@/components/shared/pagination";
import { ActivityStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatLongDate, getTodayJakarta } from "@/lib/date";
import { readNumber, readString, type SearchParams } from "@/lib/search-params";
import { requireAuth } from "@/server/auth/session";
import { guard } from "@/server/permissions/guard";
import {
  getActivitiesForIntern,
  getActivityFeedForMentor,
  getActivityTasks,
  getRecentActivities,
  getTasksForActivities,
  getTodayActivity,
} from "@/server/queries/activities";
import { getMentorInterns } from "@/server/queries/interns";
import { getTasksForUser } from "@/server/queries/tasks";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const today = getTodayJakarta();

  if (user.role === "INTERN") {
    const [todayActivity, history, assignedTasks] = await Promise.all([
      getTodayActivity(user.id),
      guard(() => getActivitiesForIntern(user, user.id, readNumber(params.page))),
      guard(() => getTasksForUser(user, { pageSize: 100 })),
    ]);

    const todayTasks = todayActivity ? await getActivityTasks(todayActivity.id) : [];
    const historyTasks = await getTasksForActivities(history.items.map((item) => item.id));

    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Activity"
          description={`Check-in harian · ${formatLongDate(today)}`}
        />

        <Card>
          <CardContent className="pt-5">
            <DailyActivityForm
              taskOptions={assignedTasks.items.map((task) => ({
                id: task.id,
                title: task.title,
                status: task.status,
              }))}
              defaults={{
                id: todayActivity?.id,
                taskIds: todayTasks.map((task) => task.id),
                summary: todayActivity?.summary ?? null,
                progress: todayActivity?.progress ?? null,
                blocker: todayActivity?.blocker ?? null,
                nextStep: todayActivity?.nextStep ?? null,
                status: todayActivity?.status ?? "DRAFT",
              }}
            />
          </CardContent>
        </Card>

        <section className="flex flex-col gap-2">
          <SectionHeader title="Riwayat aktivitas" />
          {history.items.length === 0 ? (
            <EmptyState
              title="Belum ada riwayat"
              description="Aktivitas harian Anda akan tampil di sini."
              icon={<CalendarCheck className="size-5" aria-hidden />}
            />
          ) : (
            <ListCard>
              {history.items.map((activity) => {
                const work = historyTasks.get(activity.id) ?? [];

                return (
                  <ListRow key={activity.id}>
                    <ListRowMain
                      title={
                        <Link href={`/activity/${activity.id}`} className="hover:underline">
                          {formatDate(activity.activityDate)}
                        </Link>
                      }
                      meta={
                        work.length > 0
                          ? work.map((task) => task.title).join(" · ")
                          : (activity.summary ?? "Tanpa pekerjaan tertaut")
                      }
                    />
                    <ActivityStatusBadge status={activity.status} />
                  </ListRow>
                );
              })}
            </ListCard>
          )}
          <Pagination
            page={history.page}
            totalPages={history.totalPages}
            basePath="/activity"
          />
        </section>
      </div>
    );
  }

  if (user.role === "MENTOR") {
    const [feed, interns] = await Promise.all([
      getActivityFeedForMentor(user.id, readString(params.date)),
      getMentorInterns(user.id),
    ]);

    const feedTasks = await getTasksForActivities(feed.items.map((item) => item.id));

    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Activity"
          description={`Monitoring aktivitas intern · ${formatLongDate(feed.date)}`}
        />

        {feed.missing.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>{feed.missing.length} intern belum check-in</AlertTitle>
            <AlertDescription>{feed.missing.map((row) => row.name).join(", ")}</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertDescription>Semua intern sudah check-in hari ini.</AlertDescription>
          </Alert>
        )}

        <section className="flex flex-col gap-2">
          <SectionHeader
            title="Aktivitas hari ini"
            action={
              <Badge variant="secondary">
                {feed.items.length}/{interns.length} sudah entri
              </Badge>
            }
          />
          {feed.items.length === 0 ? (
            <EmptyState
              title="Belum ada aktivitas"
              description="Belum ada intern yang mengirim aktivitas hari ini."
              icon={<CalendarCheck className="size-5" aria-hidden />}
            />
          ) : (
            <ListCard>
              {feed.items.map((item) => {
                const work = feedTasks.get(item.id) ?? [];

                return (
                  <ListRow key={item.id}>
                    <ListRowMain
                      title={
                        <Link href={`/activity/${item.id}`} className="hover:underline">
                          {item.internName}
                        </Link>
                      }
                      meta={
                        work.length > 0
                          ? work.map((task) => task.title).join(" · ")
                          : (item.summary ?? "Tanpa pekerjaan tertaut")
                      }
                    />
                    <ActivityStatusBadge status={item.status} />
                  </ListRow>
                );
              })}
            </ListCard>
          )}
        </section>
      </div>
    );
  }

  const recent = await getRecentActivities();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Activity" description="Aktivitas harian terbaru dari seluruh intern." />

      {recent.length === 0 ? (
        <EmptyState
          title="Belum ada aktivitas"
          description="Aktivitas harian intern akan tampil di sini."
          icon={<CalendarCheck className="size-5" aria-hidden />}
        />
      ) : (
        <ListCard>
          {recent.map((activity) => (
            <ListRow key={activity.id}>
              <ListRowMain
                title={
                  <Link href={`/activity/${activity.id}`} className="hover:underline">
                    {activity.internName}
                  </Link>
                }
                meta={`${formatDate(activity.activityDate)} · ${
                  activity.summary ?? "Tanpa catatan"
                }`}
              />
              <ActivityStatusBadge status={activity.status} />
            </ListRow>
          ))}
        </ListCard>
      )}
    </div>
  );
}
