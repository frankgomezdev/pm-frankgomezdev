import { Badge } from "@/components/catalyst/badge";
import { TASK_STATUSES, type TaskStatus } from "@/lib/types/task";

const STATUS_COLORS: Record<TaskStatus, "zinc" | "sky" | "emerald"> = {
  todo: "zinc",
  in_progress: "sky",
  done: "emerald",
};

type StatusPillProps = {
  status: TaskStatus;
  className?: string;
};

export function StatusPill({ status, className }: StatusPillProps) {
  const label =
    TASK_STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <Badge color={STATUS_COLORS[status]} className={className}>
      {label}
    </Badge>
  );
}

type FlagPillProps = {
  kind: "blocked" | "quiet";
  daysQuiet?: number;
  className?: string;
};

export function FlagPill({ kind, daysQuiet, className }: FlagPillProps) {
  const label =
    kind === "blocked"
      ? "Blocked"
      : `Quiet${typeof daysQuiet === "number" ? ` ${daysQuiet}d` : ""}`;

  return (
    <Badge color={kind === "blocked" ? "amber" : "zinc"} className={className}>
      {label}
    </Badge>
  );
}
