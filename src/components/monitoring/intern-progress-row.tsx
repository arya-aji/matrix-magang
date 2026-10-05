import Link from "next/link";

import { ListRow, ListRowMain } from "@/components/shared/list";
import { Badge } from "@/components/ui/badge";
import type { MonitoringRow } from "@/server/queries/interns";

/** One intern's daily progress toward the shared target. */
export function InternProgressRow({ row }: { row: MonitoringRow }) {
  return (
    <ListRow>
      <ListRowMain
        title={
          <Link href={`/interns/${row.internId}`} className="hover:underline">
            {row.name}
          </Link>
        }
        meta={row.departmentName ?? "Tanpa departemen"}
      />

      <div className="flex shrink-0 items-center gap-2">
        <span className="tabular-nums text-sm font-medium">
          {row.total}
          <span className="text-muted-foreground">/{row.target}</span>
        </span>
        {row.met ? (
          <Badge variant="secondary">Tercapai</Badge>
        ) : (
          <Badge variant="outline">{row.percent}%</Badge>
        )}
      </div>
    </ListRow>
  );
}
