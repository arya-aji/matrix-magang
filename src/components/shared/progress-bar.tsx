import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  label,
  showValue = true,
  className,
}: {
  value: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label || showValue ? (
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{label}</span>
          {showValue ? <span className="font-medium tabular-nums">{clamped}%</span> : null}
        </div>
      ) : null}
      <Progress
        value={clamped}
        aria-label={label ? `${label}: ${clamped}%` : `Progress ${clamped}%`}
      />
    </div>
  );
}
