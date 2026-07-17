import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { setActivityOnWrite } from "@/lib/activity/api";
import {
  messageAssigned,
  messageBlockerCleared,
  messageStatusChanged,
  messageTaskCreated,
  resolveOutcomeTitle,
  resolveUserLabel,
} from "@/lib/activity/messages";
import { getFirestoreDb } from "@/lib/firebase/client";
import {
  blockerFieldsChanged,
  wasBlockerCleared,
} from "@/lib/tasks/stall";
import type {
  Task,
  TaskCreateInput,
  TaskStatus,
  TaskUpdateInput,
} from "@/lib/types/task";
import type { ActivityWrite } from "@/lib/types/activity";

function normalizeNullableId(value: unknown): string | null {
  if (value == null) return null;
  const id = String(value).trim();
  return id.length > 0 ? id : null;
}

function mapTask(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    projectId: String(data.projectId ?? ""),
    outcomeId: normalizeNullableId(data.outcomeId),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    status: (data.status as TaskStatus) ?? "todo",
    assigneeId: normalizeNullableId(data.assigneeId),
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

function buildUpdateActivityEvents(args: {
  taskId: string;
  actorId: string;
  previous: Task;
  title: string;
  projectId: string;
  status: TaskStatus;
  assigneeId: string | null;
  outcomeId: string | null;
  blockedByTaskIds: string[];
  blockerNote: string | null;
  nextAction: string | null;
  outcomeTitle: string | null;
  assigneeName: string | null;
  unblockedNames: string[];
}): ActivityWrite[] {
  const {
    taskId,
    actorId,
    previous,
    title,
    projectId,
    status,
    assigneeId,
    outcomeId,
    blockedByTaskIds,
    blockerNote,
    nextAction,
    outcomeTitle,
    assigneeName,
    unblockedNames,
  } = args;

  const events: ActivityWrite[] = [];

  if (status !== previous.status) {
    events.push({
      type:
        status === "done" && outcomeId ? "outcome_progress" : "status_changed",
      actorId,
      projectId,
      taskId,
      outcomeId,
      message: messageStatusChanged({
        title,
        from: previous.status,
        to: status,
        outcomeTitle,
        unblockedNames,
      }),
    });
  }

  if (assigneeId !== previous.assigneeId) {
    events.push({
      type: "assigned",
      actorId,
      projectId,
      taskId,
      outcomeId,
      message: messageAssigned({
        title,
        assigneeName,
        outcomeTitle,
      }),
    });
  }

  if (
    wasBlockerCleared(previous, {
      blockedByTaskIds,
      blockerNote,
    })
  ) {
    events.push({
      type: "blocker_cleared",
      actorId,
      projectId,
      taskId,
      outcomeId,
      message: messageBlockerCleared({
        title,
        nextAction,
      }),
    });
  }

  return events;
}

async function resolveUnblockedNames(
  taskId: string,
  projectId: string,
): Promise<string[]> {
  const siblings = await listTasksByProject(projectId);
  const dependents = siblings.filter(
    (t) => t.id !== taskId && t.blockedByTaskIds.includes(taskId),
  );
  const labels = await Promise.all(
    dependents.map((t) => resolveUserLabel(t.assigneeId)),
  );
  return [...new Set(labels.filter((n): n is string => Boolean(n)))];
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

  const outcomeId = normalizeNullableId(input.outcomeId);
  const assigneeId = normalizeNullableId(input.assigneeId);

  const [outcomeTitle, assigneeName] = await Promise.all([
    resolveOutcomeTitle(outcomeId),
    resolveUserLabel(assigneeId),
  ]);

  const db = getFirestoreDb();
  const batch = writeBatch(db);
  const taskRef = doc(collection(db, "tasks"));
  const now = serverTimestamp();

  batch.set(taskRef, {
    projectId: input.projectId,
    outcomeId,
    title,
    description: input.description.trim(),
    status: input.status,
    assigneeId,
    blockedByTaskIds: [],
    blockerNote: null,
    nextAction: null,
    lastMovedAt: now,
    createdBy: uid,
    createdAt: now,
    updatedAt: now,
    archived: false,
  });

  setActivityOnWrite(batch, {
    type: "task_created",
    actorId: uid,
    projectId: input.projectId,
    taskId: taskRef.id,
    outcomeId,
    message: messageTaskCreated({
      title,
      outcomeTitle,
      assigneeName,
    }),
  });

  await batch.commit();
  return taskRef.id;
}

/**
 * Updates a task and its activity events atomically.
 * Diffs against the server copy inside a transaction (not the client's
 * last-loaded snapshot) so concurrent editors don't double-log events.
 * The `previous` argument is retained for callers but ignored for diffs.
 */
export async function updateTask(
  taskId: string,
  input: TaskUpdateInput,
  _previous: Task,
  actorId: string,
): Promise<void> {
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required.");
  if (!input.projectId) throw new Error("Choose a project.");

  const outcomeId = normalizeNullableId(input.outcomeId);
  const assigneeId = normalizeNullableId(input.assigneeId);
  const blockedByTaskIds = [...new Set(input.blockedByTaskIds)].filter(
    (id) => id && id !== taskId,
  );
  const blockerNote = input.blockerNote?.trim() || null;
  const nextAction = input.nextAction?.trim() || null;

  const [outcomeTitle, assigneeName, unblockedNames] = await Promise.all([
    resolveOutcomeTitle(outcomeId),
    resolveUserLabel(assigneeId),
    input.status === "done"
      ? resolveUnblockedNames(taskId, input.projectId)
      : Promise.resolve<string[]>([]),
  ]);

  const db = getFirestoreDb();
  const taskRef = doc(db, "tasks", taskId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(taskRef);
    if (!snap.exists()) {
      throw new Error("Task not found.");
    }
    const previous = mapTask(snap.id, snap.data());

    const outcomeChanged = outcomeId !== previous.outcomeId;
    const blockerChanged = blockerFieldsChanged(previous, {
      blockedByTaskIds,
      blockerNote,
      nextAction,
    });
    const meaningfulMove =
      title !== previous.title ||
      input.status !== previous.status ||
      assigneeId !== previous.assigneeId ||
      outcomeChanged ||
      blockerChanged;

    tx.update(taskRef, {
      projectId: input.projectId,
      outcomeId,
      title,
      description: input.description.trim(),
      status: input.status,
      assigneeId,
      blockedByTaskIds,
      blockerNote,
      nextAction,
      updatedAt: serverTimestamp(),
      ...(meaningfulMove ? { lastMovedAt: serverTimestamp() } : {}),
    });

    const events = buildUpdateActivityEvents({
      taskId,
      actorId,
      previous,
      title,
      projectId: input.projectId,
      status: input.status,
      assigneeId,
      outcomeId,
      blockedByTaskIds,
      blockerNote,
      nextAction,
      outcomeTitle,
      assigneeName,
      unblockedNames,
    });

    for (const event of events) {
      setActivityOnWrite(tx, event);
    }
  });
}
