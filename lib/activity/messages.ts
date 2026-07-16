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
  return parts.length === 1 ? parts[0] : `${parts[0]} — ${parts.slice(1).join("; ")}`;
}

export function messageStatusChanged(opts: {
  title: string;
  from: TaskStatus;
  to: TaskStatus;
  outcomeTitle: string | null;
}): string {
  let msg = `Moved “${opts.title}” from ${statusLabel(opts.from)} to ${statusLabel(opts.to)}`;
  if (opts.to === "done" && opts.outcomeTitle) {
    msg += ` — toward ${opts.outcomeTitle}`;
  } else if (opts.outcomeTitle) {
    msg += ` (${opts.outcomeTitle})`;
  }
  return msg;
}

export function messageAssigned(opts: {
  title: string;
  assigneeName: string | null;
  outcomeTitle: string | null;
}): string {
  const who = opts.assigneeName ?? "Unassigned";
  let msg =
    opts.assigneeName == null
      ? `Cleared assignee on “${opts.title}”`
      : `Assigned “${opts.title}” to ${who}`;
  if (opts.outcomeTitle) {
    msg += ` — ${opts.outcomeTitle}`;
  }
  return msg;
}
