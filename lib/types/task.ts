export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  projectId: string;
  outcomeId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  blockedByTaskIds: string[];
  blockerNote: string | null;
  nextAction: string | null;
  lastMovedAt: unknown;
  createdBy: string;
  createdAt: unknown;
  updatedAt: unknown;
  archived: boolean;
};

export type TaskCreateInput = {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
};

export type TaskUpdateInput = {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  projectId: string;
};

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];
