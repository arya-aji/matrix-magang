import Link from "next/link";

import { ListRow, ListRowMain } from "@/components/shared/list";
import { InternshipStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import type { InternRosterRow } from "@/server/queries/interns";

/**
 * Dense one-line summary of an intern for the admin roster.
 */
export function InternRow({ intern }: { intern: InternRosterRow }) {
  return (
    <ListRow>
      <ListRowMain
        title={
          <Link href={`/interns/${intern.internId}`} className="hover:underline">
            {intern.name}
          </Link>
        }
        meta={intern.departmentName ?? "Tanpa departemen"}
      />

      <div className="flex shrink-0 items-center gap-1.5">
        {intern.internshipStatus ? (
          <InternshipStatusBadge status={intern.internshipStatus} />
        ) : (
          <Badge variant="outline">Belum ada magang</Badge>
        )}
      </div>
    </ListRow>
  );
}
