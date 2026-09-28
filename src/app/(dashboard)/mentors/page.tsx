import { Award } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/server/auth/session";
import { getMentorsWithCounts } from "@/server/queries/users";

export default async function MentorsPage() {
  await requireRole("ADMIN");
  const mentors = await getMentorsWithCounts();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Mentors" description={`${mentors.length} mentor terdaftar.`} />

      {mentors.length === 0 ? (
        <EmptyState
          title="Belum ada mentor"
          description="Tambahkan user dengan role MENTOR terlebih dahulu."
          icon={<Award className="size-5" aria-hidden />}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="py-4">
              <CardContent className="flex items-center justify-between gap-2 px-4">
                <div className="min-w-0">
                  <Link href={`/mentors/${mentor.id}`} className="font-medium hover:underline">
                    {mentor.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{mentor.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">{mentor.internCount} intern</Badge>
                  {!mentor.isActive ? <Badge variant="destructive">Nonaktif</Badge> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
