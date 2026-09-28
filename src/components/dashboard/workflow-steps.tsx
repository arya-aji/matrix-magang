import {
  Award,
  CalendarCheck,
  ChartColumn,
  Check,
  ClipboardList,
  Funnel,
  Gauge,
  ListChecks,
  MessageSquare,
  Settings,
  Star,
  UserCog,
  Users,
} from "lucide-react";

import { Collapsible } from "@/components/shared/collapsible";
import type { UserRole } from "@/db/schema";
import { cn } from "@/lib/utils";

/**
 * Per-role business flow shown on the dashboard so each user can see where
 * they are in the process and what comes next.
 *
 * The workflow definitions are intentionally data-only (no annotations) so
 * TypeScript infers the exact icon component types.
 */
const WORKFLOWS = {
  INTERN: {
    caption: "Alur kerja intern",
    steps: [
      {
        title: "Lihat tugas",
        description: "Tugas dari mentor muncul di halaman Tasks beserta tenggatnya.",
        icon: ListChecks,
      },
      {
        title: "Kerjakan & update progress",
        description: "Geser progress di halaman tugas; status menyesuaikan otomatis.",
        icon: Gauge,
      },
      {
        title: "Check-in aktivitas harian",
        description: "Isi apa yang dikerjakan, blocker, dan rencana berikutnya.",
        icon: CalendarCheck,
      },
      {
        title: "Terima feedback mentor",
        description: "Masukan mentor tampil pada detail tugas dan profil Anda.",
        icon: MessageSquare,
      },
      {
        title: "Dinilai performa",
        description: "Aktivitas harian menjadi bukti penilaian mentor per kriteria.",
        icon: Star,
      },
    ],
  },
  MENTOR: {
    caption: "Alur kerja mentor",
    steps: [
      {
        title: "Kelola intern bimbingan",
        description: "Pastikan setiap intern punya mentor dan departemen yang benar.",
        icon: Users,
      },
      {
        title: "Buat & tugaskan tugas",
        description: "Satu tugas bisa dikerjakan lebih dari satu intern sekaligus.",
        icon: ClipboardList,
      },
      {
        title: "Pantau progress & blocker",
        description: "Dashboard menandai siapa yang terhambat atau melewati tenggat.",
        icon: Funnel,
      },
      {
        title: "Tinjau aktivitas harian",
        description: "Cek siapa yang belum check-in hari ini dan apa blocker-nya.",
        icon: CalendarCheck,
      },
      {
        title: "Beri feedback",
        description: "Feedback kontekstual pada tugas atau pada intern langsung.",
        icon: MessageSquare,
      },
      {
        title: "Review performa",
        description: "Isi skor 1–5 per kriteria, lalu finalisasi (read-only).",
        icon: Star,
      },
    ],
  },
  ADMIN: {
    caption: "Alur kerja administrator",
    steps: [
      {
        title: "Kelola user & departemen",
        description: "Buat akun admin, mentor, dan intern serta departemennya.",
        icon: UserCog,
      },
      {
        title: "Tetapkan mentor & periode",
        description: "Hubungkan intern dengan mentor dan tanggal magang.",
        icon: Users,
      },
      {
        title: "Atur kriteria performa",
        description: "Total bobot kriteria aktif harus tepat 100.",
        icon: Settings,
      },
      {
        title: "Pantau operasional",
        description: "Awasi tugas aktif, blocker, overdue, dan check-in harian.",
        icon: ChartColumn,
      },
      {
        title: "Tinjau review final",
        description: "Lihat seluruh review performa lintas tim dan departemen.",
        icon: Award,
      },
    ],
  },
} as const;

export function WorkflowSteps({
  role,
  activeStep,
  compact = false,
}: {
  role: UserRole;
  /** 1-based index of the step the user is currently on (optional). */
  activeStep?: number;
  /** Collapsed by default so the flow never dominates the dashboard. */
  compact?: boolean;
}) {
  const workflow = WORKFLOWS[role];

  const hasActive =
    typeof activeStep === "number" &&
    activeStep >= 1 &&
    activeStep <= workflow.steps.length;

  const summary = (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
      <span>{workflow.caption}</span>
      {hasActive ? (
        <>
          <span className="text-xs font-normal text-muted-foreground">
            Langkah {activeStep}/{workflow.steps.length}
          </span>
          <span className="truncate text-xs font-normal text-primary">
            · {workflow.steps[activeStep - 1]?.title}
          </span>
        </>
      ) : null}
    </span>
  );

  return (
    <Collapsible summary={summary} defaultOpen={!compact}>
      <ol className="flex flex-col">
          {workflow.steps.map((step, index) => {
            const stepNumber = index + 1;
            const isDone = Boolean(activeStep && stepNumber < activeStep);
            const isCurrent = activeStep === stepNumber;
            const Icon = step.icon;

            return (
              <li key={step.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      isDone && "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary text-primary",
                      !isDone && !isCurrent && "border-border text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {isDone ? <Check className="size-3.5" /> : stepNumber}
                  </span>
                  {stepNumber < workflow.steps.length ? (
                    <span className="my-1 w-px flex-1 bg-border" aria-hidden />
                  ) : null}
                </div>

                <div className={cn("min-w-0 pb-4", stepNumber === workflow.steps.length && "pb-0")}>
                  <p
                    className={cn(
                      "flex items-center gap-1.5 text-sm",
                      isCurrent ? "font-semibold" : "font-medium",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    {step.title}
                    {isCurrent ? (
                      <span className="text-xs font-normal text-primary">· sekarang</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                </div>
              </li>
            );
          })}
      </ol>
    </Collapsible>
  );
}
