import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function FeedbackList({
  entries,
}: {
  entries: {
    id: string;
    content: string;
    createdAt: Date;
    authorName: string;
    authorRole: string;
  }[];
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada feedback.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <Card key={entry.id} className="gap-2 py-4">
          <CardContent className="flex gap-3 px-4">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback>{initials(entry.authorName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-sm font-medium">
                  {entry.authorName}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    · {ROLE_LABELS[entry.authorRole] ?? entry.authorRole}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap">{entry.content}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
