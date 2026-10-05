import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { getSessionUser } from "@/server/auth/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: `Masuk · ${APP_NAME}`,
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
      <div className="flex flex-col items-center gap-1 text-center">
        <span
          aria-hidden
          className="flex h-11 items-center justify-center rounded-xl bg-primary px-3 text-base font-bold tracking-tight text-primary-foreground"
        >
          INMA
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Masuk</CardTitle>
          <CardDescription>Gunakan akun internal Anda untuk melanjutkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>

      {process.env.NODE_ENV !== "production" ? (
        <p className="max-w-sm text-center text-xs text-muted-foreground">
          Akun admin (development): admin@example.com — kata sandi dari SEED_ADMIN_PASSWORD.
        </p>
      ) : null}
    </div>
  );
}
