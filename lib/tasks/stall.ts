import type { Task } from "@/lib/types/task";

export function taskTimestampMs(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function isTaskStalled(
  task: Task,
  stallDaysThreshold: number,
  now = Date.now(),
): boolean {
  if (task.status === "done" || task.archived) return false;
  const movedAt = taskTimestampMs(task.lastMovedAt);
  if (!movedAt) return false;
  const thresholdMs = Math.max(1, stallDaysThreshold) * 24 * 60 * 60 * 1000;
  return now - movedAt >= thresholdMs;
}

export function daysSinceLastMove(task: Task, now = Date.now()): number {
  const movedAt = taskTimestampMs(task.lastMovedAt);
  if (!movedAt) return 0;
  return Math.floor((now - movedAt) / (24 * 60 * 60 * 1000));
}

export function isTaskBlocked(task: Task): boolean {
  if (task.status === "done" || task.archived) return false;
  return Boolean(task.blockerNote?.trim()) || task.blockedByTaskIds.length > 0;
}

function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export function blockerFieldsChanged(
  previous: Task,
  next: {
    blockedByTaskIds: string[];
    blockerNote: string | null;
    nextAction: string | null;
  },
): boolean {
  const prevNote = previous.blockerNote?.trim() || "";
  const nextNote = next.blockerNote?.trim() || "";
  const prevAction = previous.nextAction?.trim() || "";
  const nextAction = next.nextAction?.trim() || "";
  return (
    !sameIdSet(previous.blockedByTaskIds, next.blockedByTaskIds) ||
    prevNote !== nextNote ||
    prevAction !== nextAction
  );
}

export function wasBlockerCleared(
  previous: Task,
  next: {
    blockedByTaskIds: string[];
    blockerNote: string | null;
  },
): boolean {
  const hadBlocker =
    Boolean(previous.blockerNote?.trim()) ||
    previous.blockedByTaskIds.length > 0;
  const stillBlocked =
    Boolean(next.blockerNote?.trim()) || next.blockedByTaskIds.length > 0;
  return hadBlocker && !stillBlocked;
}
