import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Akses ditolak",
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <ShieldX className="mx-auto size-8 text-destructive" aria-hidden />
          <CardTitle>403 — Akses ditolak</CardTitle>
          <CardDescription>
            Anda tidak memiliki izin untuk membuka halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link href="/dashboard">Kembali ke dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
