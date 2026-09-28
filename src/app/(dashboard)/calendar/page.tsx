import { CalendarCheck, CircleCheck, CircleX } from "lucide-react";
import Link from "next/link";

import { MonthCalendar, type DayIndicator } from "@/components/calendar/month-calendar";
import { Collapsible } from "@/components/shared/collapsible";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard, ListRow, ListRowMain, SectionHeader } from "@/components/shared/list";
import { PageHeader } from "@/components/layout/page-header";
import { ActivityStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatLongDate, getMonthDates, getMonthKey, getTodayJakarta } from "@/lib/date";
import { readString, type SearchParams } from "@/lib/search-params";
import { requireAuth } from "@/server/auth/session";
import {
  getActivityByDate,
  getActivityFeedForMentor,
  getActivityTasks,
  getCompanyActivityFeed,
  getCompanyActivityMonth,
  getInternActivityMonth,
  getMentorActivityMonth,
  getTasksForActivities,
} from "@/server/queries/activities";
import { getMentorInterns } from "@/server/queries/interns";

function normalizeMonth(value?: string): string | undefined {
  return value && /^\d{4}-\d{2}$/.test(value) ? value : undefined;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  const today = getTodayJakarta();
  const monthKey = normalizeMonth(readString(params.month)) ?? getMonthKey(today);
  const days = getMonthDates(monthKey);

  const requestedDate = readString(params.date);
  const selectedDate =
    requestedDate && days.includes(requestedDate)
      ? requestedDate
      : days.includes(today)
        ? today
        : (days[0] ?? today);

  const basePath = "/calendar";

  /* ------------------------------- INTERN ------------------------------- */
  if (user.role === "INTERN") {
    const [monthRows, selected] = await Promise.all([
      getInternActivityMonth(user.id, monthKey),
      getActivityByDate(user.id, selectedDate),
    ]);

    const indicators = new Map<string, DayIndicator>();
    for (const row of monthRows) {
      indicators.set(row.activityDate, {
        kind: row.status === "SUBMITTED" ? "submitted" : "draft",
      });
    }

    const selectedTasks = selected ? await getActivityTasks(selected.id) : [];

    const filledDates = new Set(monthRows.map((row) => row.activityDate));
    const elapsedDays = days.filter((day) => day <= today);
    const missingDates = elapsedDays.filter((day) => !filledDates.has(day));

    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Kalender"
          description="Lihat tanggal mana yang sudah Anda entri dan mana yang belum."
        />

        <Card>
          <CardContent className="pt-5">
            <MonthCalendar
              monthKey={monthKey}
              selectedDate={selectedDate}
              today={today}
              indicators={indicators}
              basePath={basePath}
            />
          </CardContent>
        </Card>

        <Collapsible
          summary={
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
              <span>Rekap bulan ini</span>
              <span className="text-xs font-normal text-muted-foreground">
                {filledDates.size}/{elapsedDays.length} hari terisi
              </span>
              {missingDates.length > 0 ? (
                <span className="text-xs font-normal text-destructive">
                  · {missingDates.length} belum
                </span>
              ) : null}
            </span>
          }
        >
          {missingDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Semua hari sudah terisi.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">Belum ada entri pada:</p>
              <div className="flex flex-wrap gap-1.5">
                {missingDates.map((day) => (
                  <Link key={day} href={`${basePath}?month=${monthKey}&date=${day}`}>
                    <Badge variant="outline">{formatDate(day)}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Collapsible>

        <section className="flex flex-col gap-2">
          <SectionHeader
            title={`Entri ${formatLongDate(selectedDate)}`}
            action={
              selected ? (
                <Link
                  href={`/activity/${selected.id}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Detail →
                </Link>
              ) : undefined
            }
          />

          {selected ? (
            <ListCard>
              <ListRow>
                <ListRowMain title="Status" />
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {selected.progress ?? 0}%
                  </span>
                  <ActivityStatusBadge status={selected.status} />
                </span>
              </ListRow>

              <ListRow>
                <ListRowMain
                  title="Pekerjaan"
                  meta={
                    selectedTasks.length === 0 ? "Tidak ada pekerjaan tertaut" : undefined
                  }
                />
                {selectedTasks.length > 0 ? (
                  <span className="flex shrink-0 flex-wrap justify-end gap-1">
                    {selectedTasks.map((task) => (
                      <Badge key={task.id} variant="outline">
                        {task.title}
                      </Badge>
                    ))}
                  </span>
                ) : null}
              </ListRow>

              {selected.summary ? (
                <ListRow>
                  <ListRowMain title="Catatan" meta={selected.summary} />
                </ListRow>
              ) : null}

              {selected.blocker ? (
                <ListRow>
                  <ListRowMain title="Blocker" meta={selected.blocker} />
                </ListRow>
              ) : null}
            </ListCard>
          ) : selectedDate === today ? (
            <Card>
              <CardContent className="flex items-center justify-between gap-3 pt-5">
                <p className="text-sm text-muted-foreground">Belum ada entri hari ini.</p>
                <Button asChild size="sm">
                  <Link href="/activity">Isi</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="Tidak ada entri"
              description={`Tidak ada aktivitas yang dicatat pada ${formatDate(selectedDate)}.`}
              icon={<CalendarCheck className="size-5" aria-hidden />}
            />
          )}
        </section>
      </div>
    );
  }

  /* --------------------------- MENTOR / ADMIN --------------------------- */
  const isAdmin = user.role === "ADMIN";

  const [monthRows, feed, interns] = await Promise.all([
    isAdmin
      ? getCompanyActivityMonth(monthKey)
      : getMentorActivityMonth(user.id, monthKey),
    isAdmin
      ? getCompanyActivityFeed(selectedDate)
      : getActivityFeedForMentor(user.id, selectedDate),
    isAdmin ? Promise.resolve([]) : getMentorInterns(user.id),
  ]);

  const countByDate = new Map<string, number>();
  for (const row of monthRows) {
    countByDate.set(row.activityDate, (countByDate.get(row.activityDate) ?? 0) + 1);
  }

  const indicators = new Map<string, DayIndicator>();
  for (const [date, count] of countByDate) {
    indicators.set(date, { kind: "submitted", count });
  }

  const feedTasks = await getTasksForActivities(feed.items.map((item) => item.id));
  const submittedIds = new Set(feed.items.map((item) => item.internId));
  const entryByIntern = new Map(feed.items.map((item) => [item.internId, item]));

  const roster = (
    isAdmin
      ? [
          ...feed.items.map((item) => ({ id: item.internId, name: item.internName })),
          ...feed.missing.map((row) => ({ id: row.id, name: row.name })),
        ]
      : interns.map((intern) => ({ id: intern.id, name: intern.name }))
  ).sort((a, b) => a.name.localeCompare(b.name));

  const enteredCount = roster.filter((person) => submittedIds.has(person.id)).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Kalender"
        description={
          isAdmin
            ? "Lihat tanggal mana yang sudah ada entri kerja dan siapa yang bekerja."
            : "Lihat siapa saja yang bekerja pada tiap tanggal."
        }
      />

      <Card>
        <CardContent className="pt-5">
          <MonthCalendar
            monthKey={monthKey}
            selectedDate={selectedDate}
            today={today}
            indicators={indicators}
            basePath={basePath}
          />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2">
        <SectionHeader
          title={`Entri ${formatDate(selectedDate)}`}
          action={
            <Badge variant={enteredCount === roster.length ? "default" : "secondary"}>
              {enteredCount}/{roster.length} sudah entri
            </Badge>
          }
        />

        {roster.length === 0 ? (
          <EmptyState
            title="Belum ada intern"
            description="Belum ada intern untuk dipantau."
            icon={<CalendarCheck className="size-5" aria-hidden />}
          />
        ) : (
          <ListCard>
            {roster.map((person) => {
              const entry = entryByIntern.get(person.id);
              const tasks = entry ? (feedTasks.get(entry.id) ?? []) : [];

              return (
                <ListRow key={person.id}>
                  <ListRowMain
                    title={
                      <span className="flex items-center gap-2">
                        {entry ? (
                          <CircleCheck className="size-4 shrink-0 text-primary" aria-hidden />
                        ) : (
                          <CircleX className="size-4 shrink-0 text-destructive" aria-hidden />
                        )}
                        <Link
                          href={`/interns/${person.id}`}
                          className="truncate hover:underline"
                        >
                          {person.name}
                        </Link>
                      </span>
                    }
                    meta={
                      entry
                        ? tasks.length > 0
                          ? tasks.map((task) => task.title).join(" · ")
                          : (entry.summary ?? "Tanpa pekerjaan tertaut")
                        : "Belum entri hari ini"
                    }
                  />

                  {entry ? (
                    <Link href={`/activity/${entry.id}`} className="shrink-0">
                      <Badge variant={entry.status === "SUBMITTED" ? "default" : "secondary"}>
                        {entry.status === "SUBMITTED" ? "Terkirim" : "Draft"}
                      </Badge>
                    </Link>
                  ) : null}
                </ListRow>
              );
            })}
          </ListCard>
        )}

        {feed.items.some((item) => item.blocker) ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="text-xs font-medium text-destructive">Blocker hari ini</p>
            {feed.items
              .filter((item) => item.blocker)
              .map((item) => (
                <p key={item.id} className="text-xs text-foreground/90">
                  {item.internName}: {item.blocker}
                </p>
              ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
