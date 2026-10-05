import Link from "next/link";
import { Search, Users } from "lucide-react";

import { InternshipDialog } from "@/components/interns/internship-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { InternshipStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InternshipStatus } from "@/db/schema";
import { INTERNSHIP_STATUSES, INTERNSHIP_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { readNumber, readString, type SearchParams } from "@/lib/search-params";
import { requireRole } from "@/server/auth/session";
import { getInternsRoster } from "@/server/queries/interns";
import { getDepartments, getSelectableInterns } from "@/server/queries/users";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function InternsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const statusParam = readString(params.status);
  const status = INTERNSHIP_STATUSES.find((value) => value === statusParam) as
    | InternshipStatus
    | undefined;

  const filters = {
    q: readString(params.q),
    departmentId: readString(params.departmentId),
    status,
    page: readNumber(params.page),
  };

  const [result, departmentOptions, selectableInterns] = await Promise.all([
    getInternsRoster(filters),
    getDepartments(),
    getSelectableInterns(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Interns"
        description={`${result.total} intern terdaftar.`}
        actions={
          <InternshipDialog departments={departmentOptions} interns={selectableInterns} />
        }
      />

      <form
        method="get"
        action="/interns"
        className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-3"
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

        <div className="flex items-center gap-2 sm:col-span-3">
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
            <Card key={intern.internId} className="py-4">
              <CardContent className="flex flex-col gap-2 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/interns/${intern.internId}`}
                      className="font-medium hover:underline"
                    >
                      {intern.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {intern.departmentName ?? "Tanpa departemen"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {intern.internshipStatus ? (
                      <InternshipStatusBadge status={intern.internshipStatus} />
                    ) : null}
                    {intern.internshipId &&
                    intern.startDate &&
                    intern.endDate &&
                    intern.internshipStatus ? (
                      <InternshipDialog
                        departments={departmentOptions}
                        internship={{
                          id: intern.internshipId,
                          userId: intern.internId,
                          name: intern.name,
                          departmentId: intern.departmentId,
                          startDate: intern.startDate,
                          endDate: intern.endDate,
                          status: intern.internshipStatus,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {intern.startDate && intern.endDate
                    ? `${formatDate(intern.startDate)} – ${formatDate(intern.endDate)}`
                    : "Belum ada periode magang"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath="/interns"
        params={{ q: filters.q, departmentId: filters.departmentId, status: filters.status }}
      />
    </div>
  );
}
