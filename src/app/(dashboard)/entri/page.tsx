import { EntryForm } from "@/components/entries/entry-form";
import { EntryList } from "@/components/entries/entry-list";
import { PageHeader } from "@/components/layout/page-header";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import { formatLongDate } from "@/lib/date";
import { requireRole } from "@/server/auth/session";
import { getInternDashboard } from "@/server/queries/dashboard";

export default async function EntriPage() {
  const user = await requireRole("INTERN");
  const data = await getInternDashboard(user.id);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Entri dokumen"
        description={`${formatLongDate(data.today)} · masukkan nama usaha/keluarga satu per satu.`}
      />

      <Card className="py-0">
        <CardContent className="flex flex-col gap-2 px-4 py-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold tabular-nums">
              {data.todayTotal}
              <span className="text-base text-muted-foreground">/{data.target}</span>
            </p>
            <span className="text-xs text-muted-foreground">
              {data.met ? "Target tercapai" : `${data.percent}% dari target`}
            </span>
          </div>
          <ProgressBar value={data.percent} />
        </CardContent>
      </Card>

      <EntryForm />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Entri hari ini ({data.todayTotal})</h2>
        <EntryList entries={data.todayEntries} />
      </section>
    </div>
  );
}
