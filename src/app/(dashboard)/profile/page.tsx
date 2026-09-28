import { LogOut } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { SubmitButton } from "@/components/shared/submit-button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { requireAuth } from "@/server/auth/session";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Profil" description="Informasi akun Anda." />

      <Card>
        <CardContent className="flex items-center gap-4 pt-5">
          <Avatar className="size-14">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-medium">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-1">
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sesi</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={logoutAction}>
            <SubmitButton variant="outline" pendingText="Keluar...">
              <LogOut className="size-4" aria-hidden />
              Keluar dari akun
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
