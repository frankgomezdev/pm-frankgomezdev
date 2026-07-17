import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  type Transaction,
  type WriteBatch,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import type {
  ActivityEvent,
  ActivityType,
  ActivityWrite,
} from "@/lib/types/activity";

function mapActivity(id: string, data: Record<string, unknown>): ActivityEvent {
  return {
    id,
    type: data.type as ActivityType,
    actorId: String(data.actorId ?? ""),
    projectId: String(data.projectId ?? ""),
    taskId: (data.taskId as string | null) ?? null,
    outcomeId: (data.outcomeId as string | null) ?? null,
    message: String(data.message ?? ""),
    createdAt: data.createdAt,
  };
}

function activityPayload(event: ActivityWrite) {
  return {
    type: event.type,
    actorId: event.actorId,
    projectId: event.projectId,
    taskId: event.taskId,
    outcomeId: event.outcomeId,
    message: event.message,
    createdAt: serverTimestamp(),
  };
}

export async function logActivity(event: ActivityWrite): Promise<void> {
  await addDoc(collection(getFirestoreDb(), "activity"), activityPayload(event));
}

/** Queue an activity doc onto a batch or transaction write. */
export function setActivityOnWrite(
  writer: WriteBatch | Transaction,
  event: ActivityWrite,
): void {
  const ref = doc(collection(getFirestoreDb(), "activity"));
  const payload = activityPayload(event);
  if ("commit" in writer) {
    writer.set(ref, payload);
  } else {
    writer.set(ref, payload);
  }
}

export async function listRecentActivity(
  max = 40,
): Promise<ActivityEvent[]> {
  const q = query(
    collection(getFirestoreDb(), "activity"),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapActivity(d.id, d.data()));
}

export function activityCreatedAtMs(event: ActivityEvent): number {
  const value = event.createdAt;
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

/** Start of local calendar day (ms). */
export function startOfLocalDayMs(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
