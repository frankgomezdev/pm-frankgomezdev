"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { OutcomePicker } from "@/components/outcomes/OutcomePicker";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";
import { GoalQualityNudge } from "@/components/tasks/GoalQualityNudge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createTask, listTasksByProject } from "@/lib/tasks/api";
import { listCohortUsers, type CohortUser } from "@/lib/users/api";
import type { Outcome } from "@/lib/types/outcome";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types/task";

type Props = {
  projectId: string;
  projectActive: boolean;
  outcomes: Outcome[];
};

function readOutcomeIdFromForm(form: HTMLFormElement): string | null {
  const raw = new FormData(form).get("outcomeId");
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export function ProjectTasksSection({
  projectId,
  projectActive,
  outcomes,
}: Props) {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<CohortUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [outcomeId, setOutcomeId] = useState<string | null>(null);

  const userById = useMemo(() => {
    const map = new Map<string, CohortUser>();
    for (const u of users) map.set(u.uid, u);
    return map;
  }, [users]);

  const outcomeById = useMemo(() => {
    const map = new Map<string, Outcome>();
    for (const o of outcomes) map.set(o.id, o);
    return map;
  }, [outcomes]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [taskRows, userRows] = await Promise.all([
        listTasksByProject(projectId),
        listCohortUsers(),
      ]);
      setTasks(taskRows);
      setUsers(userRows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load project tasks. Check Firestore rules.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const submittedOutcomeId = readOutcomeIdFromForm(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await createTask(
        {
          projectId,
          title,
          description,
          status,
          assigneeId,
          outcomeId: submittedOutcomeId ?? outcomeId,
        },
        user.uid,
      );
      setTitle("");
      setDescription("");
      setStatus("todo");
      setAssigneeId(null);
      setOutcomeId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Tasks</h2>
          <p className="text-sm text-zinc-500">
            Tasks in this project.{" "}
            <Link
              href={`/tasks?project=${projectId}`}
              className="underline hover:text-zinc-800"
            >
              Open in Tasks with filter
            </Link>
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      {projectActive && (
        <form
          onSubmit={onCreate}
          className="flex flex-col gap-3 border-t border-zinc-100 pt-4"
        >
          <h3 className="text-sm font-medium text-zinc-800">Add task</h3>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </label>
          <GoalQualityNudge
            title={title}
            enabled={Boolean(profile?.preferences.nudgeGoalQuality)}
            onApplyRewrite={setTitle}
            onApplySplit={(lines) =>
              setDescription((prev) => {
                const block = [
                  "Suggested smaller steps:",
                  ...lines.map((l) => `• ${l}`),
                ].join("\n");
                return prev.trim() ? `${prev.trim()}\n\n${block}` : block;
              })
            }
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Outcome</span>
            <OutcomePicker
              outcomes={outcomes}
              value={outcomeId}
              onChange={setOutcomeId}
              disabled={busy}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-700">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-700">Assignee</span>
              <AssigneePicker
                users={users}
                value={assigneeId}
                onChange={setAssigneeId}
                disabled={busy}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-fit rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Add task"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks in this project"
          description="Add a task above, or create one from the Tasks page with this project selected."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => {
            const assignee = task.assigneeId
              ? userById.get(task.assigneeId)
              : null;
            const outcome = task.outcomeId
              ? outcomeById.get(task.outcomeId)
              : null;
            const statusLabel =
              TASK_STATUSES.find((s) => s.value === task.status)?.label ??
              task.status;
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    {task.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {statusLabel} ·{" "}
                    {assignee ? assignee.displayName : "Unassigned"}
                    {outcome ? ` · ${outcome.title}` : " · No outcome"}
                  </p>
                </div>
                <Link
                  href={`/tasks/${task.id}`}
                  className="rounded-md border border-zinc-300 px-2.5 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
