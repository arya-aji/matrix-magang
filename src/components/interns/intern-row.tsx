import Link from "next/link";

import { ListRow, ListRowMain } from "@/components/shared/list";
import { Badge } from "@/components/ui/badge";
import type { MentorInternRow } from "@/server/queries/interns";

/**
 * Dense one-line summary of an intern for list views. Replaces the previous
 * multi-row card so several interns fit on one screen.
 */
export function InternRow({ intern }: { intern: MentorInternRow }) {
  return (
    <ListRow>
      <ListRowMain
        title={
          <Link href={`/interns/${intern.id}`} className="hover:underline">
            {intern.name}
          </Link>
        }
        meta={
          <>
            {intern.departmentName ?? "Tanpa departemen"}
            {intern.activeTaskTitle ? ` · ${intern.activeTaskTitle}` : ""}
          </>
        }
      />

      <div className="flex shrink-0 items-center gap-1.5">
        {intern.hasBlocker ? <Badge variant="destructive">Terhambat</Badge> : null}
        {intern.submittedToday ? (
          <Badge variant="secondary">Check-in</Badge>
        ) : (
          <Badge variant="outline">Belum</Badge>
        )}
        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
          {intern.todayProgress}%
        </span>
      </div>
    </ListRow>
  );
}
