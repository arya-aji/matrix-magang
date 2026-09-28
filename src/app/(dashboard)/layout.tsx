import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { APP_NAME } from "@/lib/constants";
import { requireAuth } from "@/server/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();

  return (
    <AppShell user={user} appName={APP_NAME}>
      {children}
    </AppShell>
  );
}
