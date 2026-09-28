import { redirect } from "next/navigation";

import type { UserRole } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";

/** Current user, or `null` when unauthenticated. Never redirects. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
    avatarUrl: session.user.avatarUrl ?? null,
  };
}

/** For server components / pages: unauthenticated users go to `/login`. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** For server components / pages: wrong role renders the 403 page. */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/403");
  }
  return user;
}

export function hasRole(user: SessionUser, ...roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === "ADMIN";
}
