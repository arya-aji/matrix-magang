import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { EntryKind, InternshipStatus } from "@/db/schema";
import { ENTRY_KIND_LABELS, INTERNSHIP_STATUS_LABELS } from "@/lib/constants";

/**
 * Status is always communicated with a text label as well as colour
 * (accessibility requirement).
 */

export function InternshipStatusBadge({ status }: { status: InternshipStatus }) {
  return (
    <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
      {INTERNSHIP_STATUS_LABELS[status]}
    </Badge>
  );
}

const entryKindVariant: Record<EntryKind, BadgeProps["variant"]> = {
  USAHA: "default",
  KELUARGA: "secondary",
};

export function EntryKindBadge({ kind }: { kind: EntryKind }) {
  return <Badge variant={entryKindVariant[kind]}>{ENTRY_KIND_LABELS[kind]}</Badge>;
}
