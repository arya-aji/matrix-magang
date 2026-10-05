import { PageHeader } from "@/components/layout/page-header";
import { TargetForm } from "@/components/settings/target-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/server/auth/session";
import { getSettings } from "@/server/queries/settings";

export default async function SettingsPage() {
  await requireRole("ADMIN");
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Settings"
        description="Konfigurasi target entri dokumen harian."
      />

      <Card className="py-0">
        <CardContent className="px-4 py-4">
          <TargetForm dailyTarget={settings.dailyTarget} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Target berlaku sama untuk semua intern dan dibandingkan dengan jumlah entri
        yang dicatat setiap hari.
      </p>
    </div>
  );
}
