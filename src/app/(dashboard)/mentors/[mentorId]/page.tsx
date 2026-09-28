import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InternRow } from "@/components/interns/intern-row";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/server/auth/session";
import { getMentorInterns } from "@/server/queries/interns";
import { getUserById } from "@/server/queries/users";

export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  await requireRole("ADMIN");
  const { mentorId } = await params;

  const mentor = await getUserById(mentorId);
  if (!mentor || (mentor.role !== "MENTOR" && mentor.role !== "ADMIN")) notFound();

  const interns = await getMentorInterns(mentorId);

  return (
    <div className="flex flex-col gap-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/mentors">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </Link>
      </Button>

      <header>
        <h1 className="text-xl font-semibold tracking-tight">{mentor.name}</h1>
        <p className="text-sm text-muted-foreground">
          {mentor.email} · {interns.length} intern
        </p>
      </header>

      {interns.length === 0 ? (
        <EmptyState
          title="Belum ada intern"
          description="Mentor ini belum memiliki intern bimbingan."
        />
      ) : (
        <ListCard>
          {interns.map((intern) => (
            <InternRow key={intern.id} intern={intern} />
          ))}
        </ListCard>
      )}
    </div>
  );
}
