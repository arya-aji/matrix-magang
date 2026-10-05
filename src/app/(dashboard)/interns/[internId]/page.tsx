import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryList } from "@/components/entries/entry-list";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard, ListRow, ListRowMain } from "@/components/shared/list";
import { ProgressBar } from "@/components/shared/progress-bar";
import { InternshipStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { addDays, calculateInternshipProgress, formatDate, getTodayJakarta } from "@/lib/date";
import { requireRole } from "@/server/auth/session";
import { getEntriesForInternDate, getEntryTotalsByDate } from "@/server/queries/entries";
import { getInternDetail } from "@/server/queries/interns";
import { getSettings } from "@/server/queries/settings";

export default async function InternDetailPage({
  params,
}: {
  params: Promise<{ internId: string }>;
}) {
  await requireRole("ADMIN");
  const { internId } = await params;

  const intern = await getInternDetail(internId);
  if (!intern || !intern.isActive) notFound();

  const today = getTodayJakarta();
  const [{ dailyTarget: target }, todayEntries, totals] = await Promise.all([
    getSettings(),
    getEntriesForInternDate(internId, today),
    getEntryTotalsByDate(internId, addDays(today, -29), today),
  ]);

  const internshipProgress =
    intern.startDate && intern.endDate && intern.internshipStatus
      ? calculateInternshipProgress({
          startDate: intern.startDate,
          endDate: intern.endDate,
          status: intern.internshipStatus,
          today,
        })
      : null;

  const grandTotal = totals.reduce((sum, day) => sum + day.total, 0);
  const todayPercent =
    target > 0 ? Math.min(100, Math.round((todayEntries.length / target) * 100)) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/monitoring">
            <ArrowLeft className="size-4" aria-hidden />
            Kembali
          </Link>
        </Button>
      </div>

      <PageHeader
        title={intern.name}
        description={`${intern.email} · ${intern.departmentName ?? "Tanpa departemen"}`}
        actions={intern.internshipStatus ? <InternshipStatusBadge status={intern.internshipStatus} /> : undefined}
      />

      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 px-4 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Entri hari ini</p>
              <p className="text-2xl font-semibold tabular-nums">
                {todayEntries.length}
                <span className="text-base text-muted-foreground">/{target}</span>
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {todayEntries.length >= target ? "Target tercapai" : `${todayPercent}%`}
            </span>
          </div>
          <ProgressBar value={todayPercent} label="Progres target harian" />
          {intern.startDate && intern.endDate ? (
            <p className="text-xs text-muted-foreground">
              Periode: {formatDate(intern.startDate)} – {formatDate(intern.endDate)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada periode magang.</p>
          )}
          {internshipProgress ? (
            <ProgressBar value={internshipProgress.progressPercentage} label="Progres magang" />
          ) : null}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Entri hari ini ({todayEntries.length})</h2>
        <EntryList entries={todayEntries} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">
          30 hari terakhir · {grandTotal} entri
        </h2>
        {totals.length === 0 ? (
          <EmptyState title="Belum ada entri" description="Belum ada entri tercatat." />
        ) : (
          <ListCard>
            {totals.map((day) => (
              <ListRow key={day.date}>
                <ListRowMain title={formatDate(day.date)} />
                <div className="flex shrink-0 items-center gap-2">
                  <span className="tabular-nums text-sm font-medium">
                    {day.total}
                    <span className="text-muted-foreground">/{target}</span>
                  </span>
                  {day.total >= target ? (
                    <Badge variant="secondary">Tercapai</Badge>
                  ) : (
                    <Badge variant="outline">
                      {Math.min(100, Math.round((day.total / target) * 100))}%
                    </Badge>
                  )}
                </div>
              </ListRow>
            ))}
          </ListCard>
        )}
      </section>
    </div>
  );
}
