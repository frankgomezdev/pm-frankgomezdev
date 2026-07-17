import { doc, getDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { TASK_STATUSES, type TaskStatus } from "@/lib/types/task";

export async function resolveUserLabel(
  uid: string | null,
): Promise<string | null> {
  if (!uid) return null;
  const snap = await getDoc(doc(getFirestoreDb(), "users", uid));
  if (!snap.exists()) return "a teammate";
  const data = snap.data();
  return (
    String(data.displayName || "").trim() ||
    String(data.email || "").trim() ||
    "a teammate"
  );
}

export async function resolveOutcomeTitle(
  outcomeId: string | null,
): Promise<string | null> {
  if (!outcomeId) return null;
  const snap = await getDoc(doc(getFirestoreDb(), "outcomes", outcomeId));
  if (!snap.exists()) return null;
  const title = String(snap.data().title || "").trim();
  return title || null;
}

function statusLabel(status: TaskStatus): string {
  return TASK_STATUSES.find((s) => s.value === status)?.label ?? status;
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return "a teammate";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function messageTaskCreated(opts: {
  title: string;
  outcomeTitle: string | null;
  assigneeName: string | null;
}): string {
  const parts = [`Created “${opts.title}”`];
  if (opts.outcomeTitle) {
    parts.push(`linked to ${opts.outcomeTitle}`);
  }
  if (opts.assigneeName) {
    parts.push(`assigned to ${opts.assigneeName}`);
  }
  return parts.length === 1 ? parts[0]! : `${parts[0]}: ${parts.slice(1).join("; ")}`;
}

export function messageStatusChanged(opts: {
  title: string;
  from: TaskStatus;
  to: TaskStatus;
  outcomeTitle: string | null;
  unblockedNames?: string[];
}): string {
  if (opts.to === "done") {
    const names = (opts.unblockedNames ?? []).filter(Boolean);
    if (opts.outcomeTitle) {
      return `Finished “${opts.title}”. ${opts.outcomeTitle} is one step closer.`;
    }
    if (names.length > 0) {
      return `Unblocked ${formatNameList(names)} by finishing “${opts.title}”.`;
    }
    return `Finished “${opts.title}”.`;
  }

  let msg = `Moved “${opts.title}” from ${statusLabel(opts.from)} to ${statusLabel(opts.to)}.`;
  if (opts.outcomeTitle) {
    msg += ` Toward ${opts.outcomeTitle}.`;
  }
  return msg;
}

export function messageAssigned(opts: {
  title: string;
  assigneeName: string | null;
  outcomeTitle: string | null;
}): string {
  let msg =
    opts.assigneeName == null
      ? `Cleared assignee on “${opts.title}”.`
      : `Assigned “${opts.title}” to ${opts.assigneeName}.`;
  if (opts.outcomeTitle) {
    msg += ` Toward ${opts.outcomeTitle}.`;
  }
  return msg;
}

export function messageBlockerCleared(opts: {
  title: string;
  nextAction: string | null;
  unblockedNames?: string[];
}): string {
  const names = (opts.unblockedNames ?? []).filter(Boolean);
  const next = opts.nextAction?.trim();

  if (names.length > 0) {
    let msg = `Unblocked ${formatNameList(names)} by clearing the blocker on “${opts.title}”.`;
    if (next) msg += ` Next: ${next}.`;
    return msg;
  }

  if (next) {
    return `Cleared the blocker on “${opts.title}”. Next: ${next}.`;
  }
  return `Cleared the blocker on “${opts.title}”.`;
}
