"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { UserRole } from "@/db/schema";
import { cn } from "@/lib/utils";

import { desktopNav } from "./nav-config";

export function DesktopSidebar({
  role,
  appName,
  collapsed,
}: {
  role: UserRole;
  appName: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const items = desktopNav[role];

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "md:w-16" : "md:w-56 lg:w-60",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        <span
          aria-hidden
          className="flex h-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary px-2 text-[11px] font-bold tracking-tight text-sidebar-primary-foreground"
        >
          INMA
        </span>
        {!collapsed ? (
          <span className="truncate font-semibold tracking-tight">{appName}</span>
        ) : null}
      </div>

      <nav aria-label="Navigasi utama" className="flex flex-1 flex-col gap-1 p-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
