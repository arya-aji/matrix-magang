import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EditUserDialog, ResetPasswordDialog } from "@/components/users/user-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { requireRole } from "@/server/auth/session";
import { getUserById } from "@/server/queries/users";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireRole("ADMIN");
  const { userId } = await params;

  const user = await getUserById(userId);
  if (!user) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
        <Link href="/users">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </Link>
      </Button>

      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{user.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          {user.isActive ? (
            <Badge variant="outline">Aktif</Badge>
          ) : (
            <Badge variant="destructive">Nonaktif</Badge>
          )}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detail akun</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Email</span>
            <span className="text-right">{user.email}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Dibuat</span>
            <span className="text-right">{formatDateTime(user.createdAt)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Diperbarui</span>
            <span className="text-right">{formatDateTime(user.updatedAt)}</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
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
            <ResetPasswordDialog userId={user.id} userName={user.name} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
