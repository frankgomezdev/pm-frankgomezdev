import { listRecentActivity, startOfLocalDayMs } from "@/lib/activity/api";
import { listAllOutcomes } from "@/lib/outcomes/api";
import { listTasks } from "@/lib/tasks/api";
import { isTaskBlocked, isTaskStalled } from "@/lib/tasks/stall";
import type { ActivityEvent } from "@/lib/types/activity";
import type { Outcome } from "@/lib/types/outcome";

export type OutcomeProgress = {
  outcome: Outcome;
  doneCount: number;
  totalCount: number;
};

export type ProgressStats = {
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  attentionCount: number;
};

export type ProgressHomeData = {
  myToday: ActivityEvent[];
  myRecent: ActivityEvent[];
  outcomeProgress: OutcomeProgress[];
  stats: ProgressStats;
};

export async function loadProgressHome(
  actorId: string,
  stallDaysThreshold = 3,
): Promise<ProgressHomeData> {
  const [activity, outcomes, tasks] = await Promise.all([
    listRecentActivity(50),
    listAllOutcomes(),
    listTasks(),
  ]);

  const mine = activity.filter((e) => e.actorId === actorId);
  const dayStart = startOfLocalDayMs();
  const myToday = mine.filter((e) => {
    const ms =
      e.createdAt &&
      typeof e.createdAt === "object" &&
      "toMillis" in e.createdAt
        ? (e.createdAt as { toMillis: () => number }).toMillis()
        : 0;
    return ms >= dayStart;
  });
  const myRecent = mine.slice(0, 12);

  const outcomeProgress: OutcomeProgress[] = outcomes
    .filter((o) => o.status === "open")
    .map((outcome) => {
      const linked = tasks.filter((t) => t.outcomeId === outcome.id);
      const doneCount = linked.filter((t) => t.status === "done").length;
      return {
        outcome,
        doneCount,
        totalCount: linked.length,
      };
    })
    .sort((a, b) => a.outcome.title.localeCompare(b.outcome.title));

  const active = tasks.filter((t) => !t.archived);
  const stats: ProgressStats = {
    todoCount: active.filter((t) => t.status === "todo").length,
    inProgressCount: active.filter((t) => t.status === "in_progress").length,
    doneCount: active.filter((t) => t.status === "done").length,
    attentionCount: active.filter(
      (t) =>
        isTaskBlocked(t) || isTaskStalled(t, stallDaysThreshold),
    ).length,
  };

  return { myToday, myRecent, outcomeProgress, stats };
}
