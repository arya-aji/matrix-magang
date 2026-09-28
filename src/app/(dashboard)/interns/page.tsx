import { Search, Users } from "lucide-react";
import Link from "next/link";

import { InternRow } from "@/components/interns/intern-row";
import { EmptyState } from "@/components/shared/empty-state";
import { ListCard } from "@/components/shared/list";
import { InternshipStatusBadge } from "@/components/shared/status-badge";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTERNSHIP_STATUSES, INTERNSHIP_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { readNumber, readString, type SearchParams } from "@/lib/search-params";
import { requireAuth } from "@/server/auth/session";
import { guard } from "@/server/permissions/guard";
import { getInternsForAdmin, getMentorInterns } from "@/server/queries/interns";
import { getDepartments, getMentorOptions } from "@/server/queries/users";
import type { InternshipStatus } from "@/db/schema";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function InternsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  if (user.role === "INTERN") {
    return (
      <PageHeader
        title="Interns"
        description="Anda tidak memiliki akses ke daftar intern lain."
      />
    );
  }

  if (user.role === "MENTOR") {
    const interns = await getMentorInterns(user.id);
    const missingCheckIn = interns.filter((intern) => !intern.submittedToday);

    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Interns"
          description={`${interns.length} intern dalam bimbingan Anda.`}
        />

        {missingCheckIn.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>{missingCheckIn.length} intern belum check-in hari ini</AlertTitle>
            <AlertDescription>
              {missingCheckIn.map((intern) => intern.name).join(", ")}
            </AlertDescription>
          </Alert>
        ) : null}

        {interns.length === 0 ? (
          <EmptyState
            title="Belum ada intern"
            description="Admin belum menugaskan intern kepada Anda."
            icon={<Users className="size-5" aria-hidden />}
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

  const statusParam = readString(params.status);
  const status = INTERNSHIP_STATUSES.find((value) => value === statusParam) as
    | InternshipStatus
    | undefined;

  const filters = {
    q: readString(params.q),
    departmentId: readString(params.departmentId),
    mentorId: readString(params.mentorId),
    status,
    page: readNumber(params.page),
  };

  const [result, departmentOptions, mentorOptions] = await Promise.all([
    guard(() => getInternsForAdmin(filters)),
    getDepartments(),
    getMentorOptions(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Interns" description={`${result.total} intern terdaftar.`} />

      <form
        method="get"
        action="/interns"
        className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="interns-q">Cari</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="interns-q"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Nama atau email"
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="interns-department">Departemen</Label>
          <select
            id="interns-department"
            name="departmentId"
            defaultValue={filters.departmentId ?? ""}
            className={selectClass}
          >
            <option value="">Semua departemen</option>
            {departmentOptions.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="interns-mentor">Mentor</Label>
          <select
            id="interns-mentor"
            name="mentorId"
            defaultValue={filters.mentorId ?? ""}
            className={selectClass}
          >
            <option value="">Semua mentor</option>
            {mentorOptions.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="interns-status">Status</Label>
          <select
            id="interns-status"
            name="status"
            defaultValue={filters.status ?? ""}
            className={selectClass}
          >
            <option value="">Semua status</option>
            {INTERNSHIP_STATUSES.map((value) => (
              <option key={value} value={value}>
                {INTERNSHIP_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="sm">
            Terapkan
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/interns">Reset</Link>
          </Button>
        </div>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          title="Tidak ada intern"
          description="Tidak ada intern yang cocok dengan filter."
          icon={<Users className="size-5" aria-hidden />}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {result.items.map((intern) => (
            <Card key={intern.internshipId} className="py-4">
              <CardContent className="flex flex-col gap-2 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/interns/${intern.id}`}
                      className="font-medium hover:underline"
                    >
                      {intern.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {intern.departmentName ?? "Tanpa departemen"}
                    </p>
                  </div>
                  <InternshipStatusBadge status={intern.internshipStatus} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(intern.startDate)} – {formatDate(intern.endDate)}
                </p>
                {!intern.isActive ? (
                  <p className="text-xs text-destructive">Akun tidak aktif</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/interns"
        params={{
          q: filters.q,
          departmentId: filters.departmentId,
          mentorId: filters.mentorId,
          status: filters.status,
        }}
      />
    </div>
  );
}
