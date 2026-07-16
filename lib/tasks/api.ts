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
  where,
} from "firebase/firestore";
import { logActivity } from "@/lib/activity/api";
import {
  messageAssigned,
  messageStatusChanged,
  messageTaskCreated,
  resolveOutcomeTitle,
  resolveUserLabel,
} from "@/lib/activity/messages";
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

function sortByUpdatedAtDesc(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
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

export async function listTasksByProject(projectId: string): Promise<Task[]> {
  const q = query(
    collection(getFirestoreDb(), "tasks"),
    where("projectId", "==", projectId),
  );
  const snap = await getDocs(q);
  return sortByUpdatedAtDesc(
    snap.docs.map((d) => mapTask(d.id, d.data())).filter((t) => !t.archived),
  );
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
    outcomeId: input.outcomeId,
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

  const [outcomeTitle, assigneeName] = await Promise.all([
    resolveOutcomeTitle(input.outcomeId),
    resolveUserLabel(input.assigneeId),
  ]);

  await logActivity({
    type: "task_created",
    actorId: uid,
    projectId: input.projectId,
    taskId: ref.id,
    outcomeId: input.outcomeId,
    message: messageTaskCreated({
      title,
      outcomeTitle,
      assigneeName,
    }),
  });

  return ref.id;
}

export async function updateTask(
  taskId: string,
  input: TaskUpdateInput,
  previous: Task,
  actorId: string,
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
    outcomeId: input.outcomeId,
    title,
    description: input.description.trim(),
    status: input.status,
    assigneeId: input.assigneeId,
    updatedAt: serverTimestamp(),
    ...(meaningfulMove ? { lastMovedAt: serverTimestamp() } : {}),
  });

  const outcomeTitle = await resolveOutcomeTitle(input.outcomeId);

  if (input.status !== previous.status) {
    await logActivity({
      type:
        input.status === "done" && input.outcomeId
          ? "outcome_progress"
          : "status_changed",
      actorId,
      projectId: input.projectId,
      taskId,
      outcomeId: input.outcomeId,
      message: messageStatusChanged({
        title,
        from: previous.status,
        to: input.status,
        outcomeTitle,
      }),
    });
  }

  if (input.assigneeId !== previous.assigneeId) {
    const assigneeName = await resolveUserLabel(input.assigneeId);
    await logActivity({
      type: "assigned",
      actorId,
      projectId: input.projectId,
      taskId,
      outcomeId: input.outcomeId,
      message: messageAssigned({
        title,
        assigneeName,
        outcomeTitle,
      }),
    });
  }
}
