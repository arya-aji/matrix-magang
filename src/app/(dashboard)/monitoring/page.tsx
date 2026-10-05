import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { InternProgressRow } from "@/components/monitoring/intern-progress-row";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTodayJakarta } from "@/lib/date";
import { readString, type SearchParams } from "@/lib/search-params";
import { requireRole } from "@/server/auth/session";
import { getMonitoringRows } from "@/server/queries/interns";

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const date = readString(params.date) ?? getTodayJakarta();

  const { target, rows, totalEntries, metCount } = await getMonitoringRows(date);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Monitoring entri"
        description={`${rows.length} intern · target harian ${target} entri.`}
      />

      <form
        method="get"
        action="/monitoring"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="monitor-date">Tanggal</Label>
          <Input id="monitor-date" name="date" type="date" defaultValue={date} />
        </div>
        <Button type="submit" size="sm">
          Terapkan
        </Button>
      </form>

      <Card className="py-0">
        <CardContent className="grid grid-cols-3 divide-x divide-border px-0 py-3">
          <div className="flex flex-col gap-0.5 px-3">
            <span className="text-[11px] text-muted-foreground">Total entri</span>
            <span className="text-lg font-semibold tabular-nums">{totalEntries}</span>
          </div>
          <div className="flex flex-col gap-0.5 px-3">
            <span className="text-[11px] text-muted-foreground">Target tercapai</span>
            <span className="text-lg font-semibold tabular-nums">
              {metCount}/{rows.length}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 px-3">
            <span className="text-[11px] text-muted-foreground">Belum</span>
            <span className="text-lg font-semibold tabular-nums">
              {rows.length - metCount}
            </span>
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada intern"
          description="Tambahkan intern beserta periode magangnya."
          icon={<BarChart3 className="size-5" aria-hidden />}
        />
      ) : (
        <ListCard>
          {rows.map((row) => (
            <InternProgressRow key={row.internId} row={row} />
          ))}
        </ListCard>
      )}
    </div>
  );
}
