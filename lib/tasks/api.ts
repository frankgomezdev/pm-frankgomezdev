import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import type {
  Task,
  TaskCreateInput,
  TaskStatus,
  TaskUpdateInput,
} from "@/lib/types/task";

function mapTask(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    projectId: String(data.projectId ?? ""),
    outcomeId: (data.outcomeId as string | null) ?? null,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    status: (data.status as TaskStatus) ?? "todo",
    assigneeId: (data.assigneeId as string | null) ?? null,
    blockedByTaskIds: Array.isArray(data.blockedByTaskIds)
      ? (data.blockedByTaskIds as string[])
      : [],
    blockerNote: (data.blockerNote as string | null) ?? null,
    nextAction: (data.nextAction as string | null) ?? null,
    lastMovedAt: data.lastMovedAt,
    createdBy: String(data.createdBy ?? ""),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    archived: Boolean(data.archived),
  };
}

export async function listTasks(): Promise<Task[]> {
  const q = query(
    collection(getFirestoreDb(), "tasks"),
    orderBy("updatedAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapTask(d.id, d.data()))
    .filter((t) => !t.archived);
}

export async function getTask(taskId: string): Promise<Task | null> {
  const snap = await getDoc(doc(getFirestoreDb(), "tasks", taskId));
  if (!snap.exists()) return null;
  return mapTask(snap.id, snap.data());
}

export async function createTask(
  input: TaskCreateInput,
  uid: string,
): Promise<string> {
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required.");
  if (!input.projectId) throw new Error("Choose a project.");

  const now = serverTimestamp();
  const ref = await addDoc(collection(getFirestoreDb(), "tasks"), {
    projectId: input.projectId,
    outcomeId: null,
    title,
    description: input.description.trim(),
    status: input.status,
    assigneeId: input.assigneeId,
    blockedByTaskIds: [],
    blockerNote: null,
    nextAction: null,
    lastMovedAt: now,
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
    archived: false,
  });
  return ref.id;
}

export async function updateTask(
  taskId: string,
  input: TaskUpdateInput,
  previous: Task,
): Promise<void> {
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required.");
  if (!input.projectId) throw new Error("Choose a project.");

  const meaningfulMove =
    title !== previous.title ||
    input.status !== previous.status ||
    input.assigneeId !== previous.assigneeId;

  await updateDoc(doc(getFirestoreDb(), "tasks", taskId), {
    projectId: input.projectId,
    title,
    description: input.description.trim(),
    status: input.status,
    assigneeId: input.assigneeId,
    updatedAt: serverTimestamp(),
    ...(meaningfulMove ? { lastMovedAt: serverTimestamp() } : {}),
  });
}
