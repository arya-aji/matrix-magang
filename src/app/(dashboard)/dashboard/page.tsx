import { ClipboardList } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { WorkflowSteps } from "@/components/dashboard/workflow-steps";
import { InternRow } from "@/components/interns/intern-row";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ListCard,
  ListRow,
  ListRowMain,
  SectionHeader,
  SectionLink,
} from "@/components/shared/list";
import { ProgressBar } from "@/components/shared/progress-bar";
import { TaskStatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatLongDate, getTodayJakarta } from "@/lib/date";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/server/auth/session";
import {
  getAdminDashboard,
  getInternDashboard,
  getMentorDashboard,
} from "@/server/queries/dashboard";

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: process.env.APP_TIMEZONE ?? "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );

  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

/** Inline metric cell used inside the single summary card. */
function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 px-3 py-2.5">
      <span className="truncate text-[11px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-lg font-semibold tabular-nums",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </header>
  );
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const today = getTodayJakarta();

  /* --------------------------------- INTERN -------------------------------- */
  if (user.role === "INTERN") {
    const data = await getInternDashboard(user.id);
    const { internship, today: tasks, dailyActivity } = data;

    const internStep =
      tasks.totalTasks === 0
        ? 1
        : tasks.progress === 0
          ? 2
          : !dailyActivity.submitted
            ? 3
            : data.recentFeedback.length === 0
              ? 4
              : 5;

    const checkInLabel = dailyActivity.submitted
      ? "Terkirim"
      : dailyActivity.activity
        ? "Masih draft"
        : "Belum ada";

    return (
      <div className="flex flex-col gap-4">
        <DashboardHeader
          title={`${greeting()}, ${user.name.split(" ")[0]}`}
          subtitle={formatLongDate(today)}
        />

        {/* Satu kartu ringkasan menggantikan 4 kartu terpisah. */}
        <Card className="gap-0 overflow-hidden py-0">
          <CardContent className="divide-y divide-border p-0">
            <div className="px-3 py-3">
              {internship ? (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>Periode magang</span>
                    <span className="tabular-nums">
                      Hari {internship.currentDay}/{internship.totalDays}
                    </span>
                  </div>
                  <ProgressBar
                    className="mt-2"
                    value={internship.progressPercentage}
                    showValue={false}
                  />
                  <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                    {internship.departmentName ?? "Tanpa departemen"}
                    {internship.mentorName ? ` · Mentor: ${internship.mentorName}` : ""}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Data magang belum tersedia — hubungi admin.
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 divide-x divide-border">
              <Metric label="Progress" value={`${tasks.progress}%`} />
              <Metric label="Tugas aktif" value={tasks.activeTasks} />
              <Metric
                label="Terhambat"
                value={tasks.blockedTasks}
                tone={tasks.blockedTasks > 0 ? "danger" : undefined}
              />
            </div>

            <div className="flex flex-col gap-2 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0">
                  <span className="text-muted-foreground">Check-in hari ini: </span>
                  <span className="font-medium">{checkInLabel}</span>
                </span>
                {dailyActivity.tasks.length > 0 ? (
                  <span className="shrink-0 text-muted-foreground">
                    {dailyActivity.tasks.length} pekerjaan
                  </span>
                ) : null}
              </div>

              {dailyActivity.tasks.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {dailyActivity.tasks.map((task) => (
                    <Badge key={task.id} variant="outline">
                      {task.title}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <Button
                asChild
                size="lg"
                variant={dailyActivity.submitted ? "outline" : "default"}
                className="w-full"
              >
                <Link href="/activity">
                  {dailyActivity.activity
                    ? "Tambah atau ubah pekerjaan"
                    : "Catat pekerjaan hari ini"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {data.blockers.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>{data.blockers.length} tugas terhambat</AlertTitle>
            <AlertDescription>
              {data.blockers.map((task) => task.title).join(", ")}
            </AlertDescription>
          </Alert>
        ) : null}

        <WorkflowSteps role="INTERN" activeStep={internStep} compact />

        <section className="flex flex-col gap-2">
          <SectionHeader title="Tugas hari ini" action={<SectionLink href="/tasks" />} />
          {tasks.tasks.length === 0 ? (
            <EmptyState
              title="Tidak ada tugas aktif"
              description="Mentor Anda belum menugaskan tugas baru."
              icon={<ClipboardList className="size-5" aria-hidden />}
            />
          ) : (
            <ListCard>
              {tasks.tasks.map((task) => (
                <ListRow key={task.id}>
                  <ListRowMain
                    title={
                      <Link href={`/tasks/${task.id}`} className="hover:underline">
                        {task.title}
                      </Link>
                    }
                    meta={<TaskStatusBadge status={task.status} />}
                  />
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {task.progress}%
                  </span>
                </ListRow>
              ))}
            </ListCard>
          )}
        </section>

      </div>
    );
  }

  /* --------------------------------- MENTOR -------------------------------- */
  if (user.role === "MENTOR") {
    const data = await getMentorDashboard(user.id);

    const mentorStep =
      data.internCount === 0
        ? 1
        : data.activeTasks === 0
          ? 2
          : data.blockedTasks > 0 || data.overdueTasks > 0
            ? 3
            : data.todayUpdates < data.internCount
              ? 4
              : 5;

    return (
      <div className="flex flex-col gap-4">
        <DashboardHeader title={greeting()} subtitle={formatLongDate(today)} />

        <Card className="gap-0 overflow-hidden py-0">
          <CardContent className="divide-y divide-border p-0">
            <div className="grid grid-cols-4 divide-x divide-border">
              <Metric label="Intern" value={data.internCount} />
              <Metric label="Tugas aktif" value={data.activeTasks} />
              <Metric
                label="Terhambat"
                value={data.blockedTasks}
                tone={data.blockedTasks > 0 ? "danger" : undefined}
              />
              <Metric label="Terlambat" value={data.overdueTasks} />
            </div>

            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="min-w-0 text-xs">
                <span className="text-muted-foreground">Check-in hari ini: </span>
                <span className="font-medium tabular-nums">
                  {data.todayUpdates}/{data.internCount}
                </span>
              </span>
              <Button asChild size="sm" variant="outline">
                <Link href="/calendar">Kalender</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <WorkflowSteps role="MENTOR" activeStep={mentorStep} compact />

        <section className="flex flex-col gap-2">
          <SectionHeader title="Intern" action={<SectionLink href="/interns" />} />
          {data.interns.length === 0 ? (
            <EmptyState
              title="Belum ada intern"
              description="Admin belum menugaskan intern kepada Anda."
            />
          ) : (
            <ListCard>
              {data.interns.slice(0, 4).map((intern) => (
                <InternRow key={intern.id} intern={intern} />
              ))}
            </ListCard>
          )}
        </section>
      </div>
    );
  }

  /* --------------------------------- ADMIN --------------------------------- */
  const data = await getAdminDashboard();

  const adminStep =
    data.internCount === 0 ? 2 : data.blockedTasks > 0 || data.overdueTasks > 0 ? 4 : 5;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader title={greeting()} subtitle={formatLongDate(today)} />

      <Card className="gap-0 overflow-hidden py-0">
        <CardContent className="divide-y divide-border p-0">
          <div className="grid grid-cols-4 divide-x divide-border">
            <Metric label="Intern" value={data.internCount} />
            <Metric label="Mentor" value={data.mentorCount} />
            <Metric label="Tugas aktif" value={data.activeTasks} />
            <Metric
              label="Terhambat"
              value={data.blockedTasks}
              tone={data.blockedTasks > 0 ? "danger" : undefined}
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="min-w-0 text-xs">
              <span className="text-muted-foreground">Check-in hari ini: </span>
              <span className="font-medium tabular-nums">{data.todayUpdates}</span>
            </span>
            <span className="flex shrink-0 gap-1.5">
              <Button asChild size="sm" variant="outline">
                <Link href="/users">Users</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">Kriteria</Link>
              </Button>
            </span>
          </div>
        </CardContent>
      </Card>

      <WorkflowSteps role="ADMIN" activeStep={adminStep} compact />
    </div>
  );
}
