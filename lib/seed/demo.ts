import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { createOutcome } from "@/lib/outcomes/api";
import { listProjects, createProject } from "@/lib/projects/api";
import { createTask } from "@/lib/tasks/api";

export const DEMO_PROJECT_TITLE = "Demo — Review week";

export type SeedDemoResult = {
  projectId: string;
  outcomeIds: string[];
  taskIds: string[];
  alreadyExisted?: boolean;
};

/**
 * Creates a small demo project + outcomes + tasks for the signed-in user.
 * Idempotent: if an active demo project with the canonical title already
 * exists, returns that project instead of duplicating.
 */
export async function seedDemoWorkspace(
  uid: string,
  assigneeId: string | null = uid,
): Promise<SeedDemoResult> {
  const existing = (await listProjects()).find(
    (p) => p.title === DEMO_PROJECT_TITLE && p.status === "active",
  );
  if (existing) {
    return {
      projectId: existing.id,
      outcomeIds: [],
      taskIds: [],
      alreadyExisted: true,
    };
  }

  const projectId = await createProject(
    {
      title: DEMO_PROJECT_TITLE,
      description:
        "Seeded sample project for reviewers. Safe to archive when done.",
    },
    uid,
  );

  const outcomeShip = await createOutcome(
    projectId,
    {
      title: "Ship Project 1 demo path",
      description:
        "Meaningful outcome: reviewer can walk signup → assign → progress.",
      status: "open",
    },
    uid,
  );

  const outcomeUnblock = await createOutcome(
    projectId,
    {
      title: "Clear blockers for teammates",
      description: "Coordination outcome — who unblocks whom.",
      status: "open",
    },
    uid,
  );

  const taskIds: string[] = [];

  taskIds.push(
    await createTask(
      {
        projectId,
        title: "Create project and name a meaningful outcome",
        description: "Layer 0 + Layer 1 baseline for the ballot demo.",
        status: "done",
        assigneeId,
        outcomeId: outcomeShip,
      },
      uid,
    ),
  );

  taskIds.push(
    await createTask(
      {
        projectId,
        title: "Assign two tasks to different cohort members",
        description: "Use the assignee picker by display name / email.",
        status: "in_progress",
        assigneeId,
        outcomeId: outcomeShip,
      },
      uid,
    ),
  );

  taskIds.push(
    await createTask(
      {
        projectId,
        title: "Record a blocker and next action",
        description: "Shows up on /stalls until cleared.",
        status: "todo",
        assigneeId,
        outcomeId: outcomeUnblock,
      },
      uid,
    ),
  );

  await updateDoc(doc(getFirestoreDb(), "tasks", taskIds[2]!), {
    blockerNote: "Waiting on teammate confirmation of assignee list",
    nextAction: "Ping assignee in chat with the task link",
    blockedByTaskIds: [taskIds[1]!],
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(getFirestoreDb(), "activity"), {
    type: "reflection",
    actorId: uid,
    projectId,
    taskId: null,
    outcomeId: outcomeShip,
    message:
      "Reflection: Seeded demo data so reviewers can see Progress, Stalls, and outcomes quickly.",
    createdAt: serverTimestamp(),
  });

  return {
    projectId,
    outcomeIds: [outcomeShip, outcomeUnblock],
    taskIds,
  };
}
