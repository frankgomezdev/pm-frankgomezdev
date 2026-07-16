import { TASK_STATUSES, type TaskStatus } from "@/lib/types/task";

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "bg-zinc-100 text-zinc-700",
  in_progress: "bg-sky-100 text-sky-900",
  done: "bg-emerald-100 text-emerald-900",
};

type StatusPillProps = {
  status: TaskStatus;
  className?: string;
};

export function StatusPill({ status, className = "" }: StatusPillProps) {
  const label =
    TASK_STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]} ${className}`}
    >
      {label}
    </span>
  );
}

type FlagPillProps = {
  kind: "blocked" | "quiet";
  daysQuiet?: number;
  className?: string;
};

export function FlagPill({ kind, daysQuiet, className = "" }: FlagPillProps) {
  const styles =
    kind === "blocked"
      ? "bg-amber-100 text-amber-900"
      : "bg-zinc-100 text-zinc-700";
  const label =
    kind === "blocked"
      ? "Blocked"
      : `Quiet${typeof daysQuiet === "number" ? ` ${daysQuiet}d` : ""}`;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
