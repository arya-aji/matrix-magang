import {
  Award,
  Building,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Ellipsis,
  House,
  ListChecks,
  Settings,
  Star,
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
    { href: "/tasks", label: "Tasks", icon: ListChecks },
    { href: "/calendar", label: "Kalender", icon: CalendarDays },
    { href: "/activity", label: "Activity", icon: CalendarCheck },
    { href: "/profile", label: "Me", icon: User },
  ],
  MENTOR: [
    { href: "/dashboard", label: "Home", icon: House },
    { href: "/interns", label: "Interns", icon: Users },
    { href: "/tasks", label: "Tasks", icon: ListChecks },
    { href: "/calendar", label: "Kalender", icon: CalendarDays },
    { href: "/performance", label: "Reviews", icon: Star },
    { href: "/profile", label: "Me", icon: User },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Home", icon: House },
    { href: "/interns", label: "Interns", icon: Users },
    { href: "/tasks", label: "Tasks", icon: ListChecks },
  ],
} as const;

/** Items hidden behind the admin "More" sheet on mobile. */
export const adminMoreNav = [
  { href: "/users", label: "Users", icon: UserCog },
  { href: "/mentors", label: "Mentors", icon: Award },
  { href: "/departments", label: "Departments", icon: Building },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const desktopNav = {
  INTERN: [
    { href: "/dashboard", label: "Dashboard", icon: House },
    { href: "/tasks", label: "Tasks", icon: ListChecks },
    { href: "/calendar", label: "Kalender", icon: CalendarDays },
    { href: "/activity", label: "Activity", icon: CalendarCheck },
    { href: "/performance", label: "Performance", icon: Star },
    { href: "/profile", label: "Profile", icon: User },
  ],
  MENTOR: [
    { href: "/dashboard", label: "Dashboard", icon: House },
    { href: "/interns", label: "Interns", icon: Users },
    { href: "/tasks", label: "Tasks", icon: ListChecks },
    { href: "/calendar", label: "Kalender", icon: CalendarDays },
    { href: "/activity", label: "Activity", icon: CalendarCheck },
    { href: "/performance", label: "Performance", icon: Star },
    { href: "/profile", label: "Profile", icon: User },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: House },
    { href: "/interns", label: "Interns", icon: Users },
    { href: "/mentors", label: "Mentors", icon: Award },
    { href: "/users", label: "Users", icon: UserCog },
    { href: "/departments", label: "Departments", icon: Building },
    { href: "/tasks", label: "Tasks", icon: ClipboardList },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
} as const;

export type MobileNavItem = (typeof mobileNav)[keyof typeof mobileNav][number];
export type DesktopNavItem = (typeof desktopNav)[keyof typeof desktopNav][number];

export { Ellipsis };
