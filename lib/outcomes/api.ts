import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import type {
  Outcome,
  OutcomeInput,
  OutcomeStatus,
} from "@/lib/types/outcome";

function mapOutcome(id: string, data: Record<string, unknown>): Outcome {
  return {
    id,
    projectId: String(data.projectId ?? ""),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    status: (data.status as OutcomeStatus) ?? "open",
    createdBy: String(data.createdBy ?? ""),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function sortByUpdatedAtDesc(outcomes: Outcome[]): Outcome[] {
  return [...outcomes].sort((a, b) => {
    const aTime =
      a.updatedAt &&
      typeof a.updatedAt === "object" &&
      "toMillis" in a.updatedAt
        ? (a.updatedAt as { toMillis: () => number }).toMillis()
        : 0;
    const bTime =
      b.updatedAt &&
      typeof b.updatedAt === "object" &&
      "toMillis" in b.updatedAt
        ? (b.updatedAt as { toMillis: () => number }).toMillis()
        : 0;
    return bTime - aTime;
  });
}

export async function listOutcomesByProject(
  projectId: string,
): Promise<Outcome[]> {
  const q = query(
    collection(getFirestoreDb(), "outcomes"),
    where("projectId", "==", projectId),
  );
  const snap = await getDocs(q);
  return sortByUpdatedAtDesc(
    snap.docs.map((d) => mapOutcome(d.id, d.data())),
  );
}

export async function listAllOutcomes(): Promise<Outcome[]> {
  const snap = await getDocs(collection(getFirestoreDb(), "outcomes"));
  return sortByUpdatedAtDesc(
    snap.docs.map((d) => mapOutcome(d.id, d.data())),
  );
}

export async function getOutcome(outcomeId: string): Promise<Outcome | null> {
  const snap = await getDoc(doc(getFirestoreDb(), "outcomes", outcomeId));
  if (!snap.exists()) return null;
  return mapOutcome(snap.id, snap.data());
}

export async function createOutcome(
  projectId: string,
  input: OutcomeInput,
  uid: string,
): Promise<string> {
  const title = input.title.trim();
  if (!title) throw new Error("Outcome title is required.");
  if (!projectId) throw new Error("Project is required.");

  const now = serverTimestamp();
  const ref = await addDoc(collection(getFirestoreDb(), "outcomes"), {
    projectId,
    title,
    description: input.description.trim(),
    status: input.status,
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateOutcome(
  outcomeId: string,
  input: OutcomeInput,
): Promise<void> {
  const title = input.title.trim();
  if (!title) throw new Error("Outcome title is required.");

  await updateDoc(doc(getFirestoreDb(), "outcomes", outcomeId), {
    title,
    description: input.description.trim(),
    status: input.status,
    updatedAt: serverTimestamp(),
  });
}
