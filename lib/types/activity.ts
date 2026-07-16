export type ActivityType =
  | "task_created"
  | "status_changed"
  | "assigned"
  | "blocker_cleared"
  | "outcome_progress"
  | "reflection";

export type ActivityEvent = {
  id: string;
  type: ActivityType;
  actorId: string;
  projectId: string;
  taskId: string | null;
  outcomeId: string | null;
  message: string;
  createdAt: unknown;
};

export type ActivityWrite = {
  type: ActivityType;
  actorId: string;
  projectId: string;
  taskId: string | null;
  outcomeId: string | null;
  message: string;
};
