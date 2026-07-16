import {
  daysSinceLastMove,
  isTaskBlocked,
  isTaskStalled,
} from "@/lib/tasks/stall";
import { listTasks } from "@/lib/tasks/api";
import { listCohortUsers, type CohortUser } from "@/lib/users/api";
import { listProjects } from "@/lib/projects/api";
import type { Task } from "@/lib/types/task";

export type StallReason = "stalled" | "blocked";

export type StallRadarItem = {
  task: Task;
  reasons: StallReason[];
  daysQuiet: number;
  projectTitle: string;
  assigneeLabel: string | null;
  /** Who/what can unblock this task (upstream deps). */
  unblockedBy: { taskId: string; title: string; assigneeLabel: string | null }[];
  /** Tasks waiting on this one. */
  unblocks: { taskId: string; title: string; assigneeLabel: string | null }[];
};

export type StallRadarData = {
  items: StallRadarItem[];
  thresholdDays: number;
};

function userLabel(
  usersById: Map<string, CohortUser>,
  uid: string | null,
): string | null {
  if (!uid) return null;
  const user = usersById.get(uid);
  return user?.displayName || user?.email || null;
}

export async function loadStallRadar(
  stallDaysThreshold: number,
): Promise<StallRadarData> {
  const threshold = stallDaysThreshold > 0 ? stallDaysThreshold : 3;
  const [tasks, users, projects] = await Promise.all([
    listTasks(),
    listCohortUsers(),
    listProjects(),
  ]);

  const usersById = new Map(users.map((u) => [u.uid, u]));
  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const tasksById = new Map(tasks.map((t) => [t.id, t]));

  const items: StallRadarItem[] = [];

  for (const task of tasks) {
    const stalled = isTaskStalled(task, threshold);
    const blocked = isTaskBlocked(task);
    if (!stalled && !blocked) continue;

    const reasons: StallReason[] = [];
    if (stalled) reasons.push("stalled");
    if (blocked) reasons.push("blocked");

    const unblockedBy = task.blockedByTaskIds
      .map((id) => tasksById.get(id))
      .filter((t): t is Task => Boolean(t))
      .map((upstream) => ({
        taskId: upstream.id,
        title: upstream.title,
        assigneeLabel: userLabel(usersById, upstream.assigneeId),
      }));

    const unblocks = tasks
      .filter(
        (other) =>
          other.id !== task.id && other.blockedByTaskIds.includes(task.id),
      )
      .map((downstream) => ({
        taskId: downstream.id,
        title: downstream.title,
        assigneeLabel: userLabel(usersById, downstream.assigneeId),
      }));

    items.push({
      task,
      reasons,
      daysQuiet: daysSinceLastMove(task),
      projectTitle: projectsById.get(task.projectId)?.title ?? "Unknown project",
      assigneeLabel: userLabel(usersById, task.assigneeId),
      unblockedBy,
      unblocks,
    });
  }

  items.sort((a, b) => {
    const aBlocked = a.reasons.includes("blocked") ? 0 : 1;
    const bBlocked = b.reasons.includes("blocked") ? 0 : 1;
    if (aBlocked !== bBlocked) return aBlocked - bBlocked;
    return b.daysQuiet - a.daysQuiet;
  });

  return { items, thresholdDays: threshold };
}
