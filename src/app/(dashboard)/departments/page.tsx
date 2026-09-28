import { Building } from "lucide-react";

import { toggleDepartmentAction } from "@/actions/departments";
import { DepartmentDialog } from "@/components/departments/department-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SubmitButton } from "@/components/shared/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/server/auth/session";
import { getDepartments } from "@/server/queries/users";

export default async function DepartmentsPage() {
  await requireRole("ADMIN");
  const departments = await getDepartments(true);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Departments"
        description={`${departments.length} departemen.`}
        actions={<DepartmentDialog />}
      />

      {departments.length === 0 ? (
        <EmptyState
          title="Belum ada departemen"
          description="Tambahkan departemen untuk mengelompokkan intern."
          icon={<Building className="size-5" aria-hidden />}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {departments.map((department) => (
            <Card key={department.id} className="py-4">
              <CardContent className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{department.name}</p>
                  {department.description ? (
                    <p className="text-xs text-muted-foreground">{department.description}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {department.isActive ? (
                    <Badge variant="outline">Aktif</Badge>
                  ) : (
                    <Badge variant="destructive">Nonaktif</Badge>
                  )}
                  <DepartmentDialog
                    department={{
                      id: department.id,
                      name: department.name,
                      description: department.description,
                      isActive: department.isActive,
                    }}
                  />
                  <form action={toggleDepartmentAction}>
                    <input type="hidden" name="departmentId" value={department.id} />
                    <SubmitButton variant="outline" size="sm" pendingText="...">
                      {department.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </SubmitButton>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
