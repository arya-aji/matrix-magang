import {
  BarChart3,
  Building,
  ClipboardList,
  Ellipsis,
  History,
  House,
  Settings,
  User,
  UserCog,
  Users,
} from "lucide-react";

/**
 * Single navigation source of truth, shared by the mobile bottom nav and the
 * desktop sidebar. Icons are referenced directly so TypeScript can infer the
 * correct component type — no manual icon typing required.
 */

export const mobileNav = {
  INTERN: [
    { href: "/dashboard", label: "Home", icon: House },
    { href: "/entri", label: "Entri", icon: ClipboardList },
    { href: "/riwayat", label: "Riwayat", icon: History },
    { href: "/profile", label: "Me", icon: User },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Home", icon: House },
    { href: "/monitoring", label: "Monitor", icon: BarChart3 },
    { href: "/interns", label: "Interns", icon: Users },
  ],
} as const;

/** Items hidden behind the admin "More" sheet on mobile. */
export const adminMoreNav = [
  { href: "/users", label: "Users", icon: UserCog },
  { href: "/departments", label: "Departments", icon: Building },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const desktopNav = {
  INTERN: [
    { href: "/dashboard", label: "Dashboard", icon: House },
    { href: "/entri", label: "Entri Dokumen", icon: ClipboardList },
    { href: "/riwayat", label: "Riwayat", icon: History },
    { href: "/profile", label: "Profile", icon: User },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: House },
    { href: "/monitoring", label: "Monitoring", icon: BarChart3 },
    { href: "/interns", label: "Interns", icon: Users },
    { href: "/users", label: "Users", icon: UserCog },
    { href: "/departments", label: "Departments", icon: Building },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
} as const;

export type MobileNavItem = (typeof mobileNav)[keyof typeof mobileNav][number];
export type DesktopNavItem = (typeof desktopNav)[keyof typeof desktopNav][number];

export { Ellipsis };
