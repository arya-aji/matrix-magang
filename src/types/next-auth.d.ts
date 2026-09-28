import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role: UserRole;
    avatarUrl?: string | null;
  }
}

// `next-auth/jwt` only re-exports from `@auth/core/jwt`, so the interface must
// be augmented at its original declaration site for the merge to take effect.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    avatarUrl?: string | null;
  }
}
