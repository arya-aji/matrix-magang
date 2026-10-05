import { History } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard, ListRow, ListRowMain } from "@/components/shared/list";
import { Badge } from "@/components/ui/badge";
import { addDays, formatDate, getTodayJakarta } from "@/lib/date";
import { requireRole } from "@/server/auth/session";
import { getEntryTotalsByDate } from "@/server/queries/entries";
import { getSettings } from "@/server/queries/settings";

export default async function RiwayatPage() {
  const user = await requireRole("INTERN");
  const today = getTodayJakarta();
  const [{ dailyTarget: target }, totals] = await Promise.all([
    getSettings(),
    getEntryTotalsByDate(user.id, addDays(today, -29), today),
  ]);

  const grandTotal = totals.reduce((sum, day) => sum + day.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Riwayat entri"
        description={`30 hari terakhir · total ${grandTotal} entri (target ${target}/hari).`}
      />

      {totals.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat"
          description="Entri harian Anda akan tampil di sini."
          icon={<History className="size-5" aria-hidden />}
        />
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
    </div>
  );
}
