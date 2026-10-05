import { BarChart3, ClipboardList } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { EntryList } from "@/components/entries/entry-list";
import { InternProgressRow } from "@/components/monitoring/intern-progress-row";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ListCard,
  ListRow,
  ListRowMain,
  SectionHeader,
  SectionLink,
} from "@/components/shared/list";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate, formatLongDate } from "@/lib/date";
import { requireAuth } from "@/server/auth/session";
import { getAdminDashboard, getInternDashboard } from "@/server/queries/dashboard";

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

export default async function DashboardPage() {
  const user = await requireAuth();

  /* --------------------------------- INTERN -------------------------------- */
  if (user.role === "INTERN") {
    const data = await getInternDashboard(user.id);

    return (
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-lg font-semibold tracking-tight">
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="text-xs text-muted-foreground">{formatLongDate(data.today)}</p>
        </header>

        <Card className="py-0">
          <CardContent className="flex flex-col gap-3 px-4 py-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Entri hari ini</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {data.todayTotal}
                  <span className="text-base text-muted-foreground">/{data.target}</span>
                </p>
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  data.met ? "text-primary" : "text-muted-foreground",
                )}
              >
                {data.met ? "Target tercapai" : `${data.percent}%`}
              </span>
            </div>

            <ProgressBar value={data.percent} label="Progres target harian" />

            {data.internship ? (
              <p className="text-xs text-muted-foreground">
                {data.internship.departmentName ?? "Tanpa departemen"} ·{" "}
                {formatDate(data.internship.startDate)} – {formatDate(data.internship.endDate)}
              </p>
            ) : null}

            <Button asChild className="w-full">
              <Link href="/entri">
                <ClipboardList className="size-4" aria-hidden />
                Catat entri
              </Link>
            </Button>
          </CardContent>
        </Card>

        <section className="flex flex-col gap-2">
          <SectionHeader
            title="Entri hari ini"
            action={<SectionLink href="/riwayat" label="Riwayat" />}
          />
          <EntryList entries={data.todayEntries} />
        </section>

        <section className="flex flex-col gap-2">
          <SectionHeader title="7 hari terakhir" />
          <ListCard>
            {data.week.map((day) => (
              <ListRow key={day.date}>
                <ListRowMain title={formatDate(day.date)} />
                <span className="tabular-nums text-sm font-medium">
                  {day.total}
                  <span className="text-muted-foreground">/{data.target}</span>
                </span>
              </ListRow>
            ))}
            {data.week.length === 0 ? (
              <ListRow>
                <ListRowMain title="Belum ada entri" meta="Mulai catat entri hari ini." />
              </ListRow>
            ) : null}
          </ListCard>
        </section>
      </div>
    );
  }

  /* --------------------------------- ADMIN --------------------------------- */
  const data = await getAdminDashboard();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">{greeting()}, {user.name.split(" ")[0]}</h1>
        <p className="text-xs text-muted-foreground">{formatLongDate(data.today)}</p>
      </header>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 px-4 py-4">
          <div className="grid grid-cols-3 divide-x divide-border">
            <Metric label="Intern aktif" value={data.totalInterns} />
            <Metric label="Entri hari ini" value={data.totalEntries} />
            <Metric label="Target tercapai" value={`${data.metCount}/${data.totalInterns}`} />
          </div>
          <p className="text-xs text-muted-foreground">
            Target harian {data.target} entri per intern.
          </p>
          <Button asChild className="w-full">
            <Link href="/monitoring">
              <BarChart3 className="size-4" aria-hidden />
              Lihat monitoring
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2">
        <SectionHeader title="Capaian tertinggi hari ini" />
        {data.top.length === 0 ? (
          <EmptyState title="Belum ada entri" description="Belum ada entri hari ini." />
        ) : (
          <ListCard>
            {data.top.map((row) => (
              <InternProgressRow key={row.internId} row={row} />
            ))}
          </ListCard>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Belum mencapai target"
          action={<SectionLink href="/monitoring" />}
        />
        {data.below.length === 0 ? (
          <EmptyState
            title="Semua tercapai"
            description="Semua intern sudah mencapai target hari ini."
          />
        ) : (
          <ListCard>
            {data.below.map((row) => (
              <InternProgressRow key={row.internId} row={row} />
            ))}
          </ListCard>
        )}
      </section>
    </div>
  );
}
