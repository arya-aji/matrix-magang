import { UserCog } from "lucide-react";
import Link from "next/link";

import { CreateUserDialog, EditUserDialog } from "@/components/users/user-dialogs";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import { readNumber, readString, type SearchParams } from "@/lib/search-params";
import { requireRole } from "@/server/auth/session";
import { getUsers } from "@/server/queries/users";
import type { UserRole } from "@/db/schema";

const ROLE_VALUES: UserRole[] = ["ADMIN", "INTERN"];
const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const roleParam = readString(params.role);
  const role = ROLE_VALUES.find((value) => value === roleParam);

  const result = await getUsers({
    q: readString(params.q),
    role,
    page: readNumber(params.page),
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Users"
        description={`${result.total} akun terdaftar.`}
        actions={<CreateUserDialog />}
      />

      <form
        method="get"
        action="/users"
        className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-3"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="users-q">Cari</Label>
          <Input
            id="users-q"
            name="q"
            defaultValue={readString(params.q) ?? ""}
            placeholder="Nama atau email"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="users-role">Role</Label>
          <select id="users-role" name="role" defaultValue={role ?? ""} className={selectClass}>
            <option value="">Semua role</option>
            {ROLE_VALUES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">
            Terapkan
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/users">Reset</Link>
          </Button>
        </div>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          title="Tidak ada user"
          description="Tidak ada akun yang cocok dengan filter."
          icon={<UserCog className="size-5" aria-hidden />}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {result.items.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Dibuat {formatDate(user.createdAt.toISOString().slice(0, 10))}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                {user.isActive ? (
                  <Badge variant="outline">Aktif</Badge>
                ) : (
                  <Badge variant="destructive">Nonaktif</Badge>
                )}
                <EditUserDialog
                  user={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    avatarUrl: user.avatarUrl,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} basePath="/users" />
    </div>
  );
}
