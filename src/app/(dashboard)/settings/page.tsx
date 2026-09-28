import { Star } from "lucide-react";
import Link from "next/link";

import { CriterionDialog } from "@/components/performance/criterion-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/server/auth/session";
import { getActiveWeightTotal, getCriteria } from "@/server/queries/performance";

export default async function SettingsPage() {
  await requireRole("ADMIN");

  const [criteria, activeWeight] = await Promise.all([getCriteria(true), getActiveWeightTotal()]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Settings"
        description="Konfigurasi kriteria penilaian performa."
        actions={<CriterionDialog />}
      />

      {activeWeight !== 100 ? (
        <Alert variant="destructive">
          <AlertTitle>Total bobot kriteria aktif: {activeWeight}</AlertTitle>
          <AlertDescription>
            Total bobot harus tepat 100 sebelum review dapat difinalisasi.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertDescription>Total bobot kriteria aktif: 100. Konfigurasi valid.</AlertDescription>
        </Alert>
      )}

      {criteria.length === 0 ? (
        <EmptyState
          title="Belum ada kriteria"
          description="Tambahkan kriteria penilaian performa."
          icon={<Star className="size-5" aria-hidden />}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {criteria.map((criterion) => (
            <Card key={criterion.id} className="py-4">
              <CardContent className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{criterion.name}</p>
                  {criterion.description ? (
                    <p className="text-xs text-muted-foreground">{criterion.description}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary">Bobot {criterion.weight}</Badge>
                  {criterion.isActive ? (
                    <Badge variant="outline">Aktif</Badge>
                  ) : (
                    <Badge variant="destructive">Nonaktif</Badge>
                  )}
                  <CriterionDialog
                    criterion={{
                      id: criterion.id,
                      name: criterion.name,
                      description: criterion.description,
                      weight: criterion.weight,
                      isActive: criterion.isActive,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/users">Kelola users</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/departments">Kelola departemen</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/interns">Kelola interns</Link>
        </Button>
      </div>
    </div>
  );
}
