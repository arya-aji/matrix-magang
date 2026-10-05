import { ListCard, ListRow, ListRowMain } from "@/components/shared/list";
import { EntryKindBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { DocumentEntry } from "@/db/schema";
import { formatTime } from "@/lib/date";

import { DeleteEntryButton } from "./delete-entry-button";

export function EntryList({
  entries,
  canDelete = true,
}: {
  entries: DocumentEntry[];
  canDelete?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Belum ada entri"
        description="Entri nama usaha/keluarga yang Anda catat hari ini akan muncul di sini."
      />
    );
  }

  return (
    <ListCard>
      {entries.map((entry) => (
        <ListRow key={entry.id}>
          <ListRowMain
            title={entry.name}
            meta={entry.note ? entry.note : `Dicatat ${formatTime(entry.createdAt)}`}
          />
          <EntryKindBadge kind={entry.kind} />
          {canDelete ? <DeleteEntryButton entryId={entry.id} /> : null}
        </ListRow>
      ))}
    </ListCard>
  );
}
