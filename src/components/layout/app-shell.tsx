"use client";

import { PanelLeft } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { UserRole } from "@/db/schema";
import type { SessionUser } from "@/types";

import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { UserMenu } from "./user-menu";

/**
 * Responsive shell: collapsible desktop sidebar + mobile bottom navigation.
 * `children` are server-rendered and passed straight through.
 */
export function AppShell({
  user,
  appName,
  children,
}: {
  user: SessionUser;
  appName: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const role: UserRole = user.role;

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <DesktopSidebar role={role} appName={appName} collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur md:px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            aria-pressed={collapsed}
          >
            <PanelLeft className="size-4" aria-hidden />
          </Button>

          <span className="font-semibold tracking-tight md:hidden">{appName}</span>

          <div className="ml-auto flex items-center gap-2">
            <UserMenu user={user} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-4 pb-24 md:px-6 md:pb-8">
          {children}
        </main>

        <MobileBottomNav role={role} />
      </div>
    </div>
  );
}
