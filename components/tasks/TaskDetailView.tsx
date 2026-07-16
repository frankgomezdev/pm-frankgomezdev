"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { OutcomePicker } from "@/components/outcomes/OutcomePicker";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";
import { listOutcomesByProject } from "@/lib/outcomes/api";
import { listProjects } from "@/lib/projects/api";
import { getTask, updateTask } from "@/lib/tasks/api";
import { listCohortUsers, type CohortUser } from "@/lib/users/api";
import type { Outcome } from "@/lib/types/outcome";
import type { Project } from "@/lib/types/project";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types/task";

export function TaskDetailView() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<CohortUser[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState("");
  const [outcomeId, setOutcomeId] = useState<string | null>(null);

  const projectOptions = useMemo(() => {
    if (!task) return projects.filter((p) => p.status === "active");
    const active = projects.filter((p) => p.status === "active");
    const current = projects.find((p) => p.id === task.projectId);
    if (current && current.status === "archived") {
      return [current, ...active];
    }
    return active;
  }, [projects, task]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [row, projectRows, userRows] = await Promise.all([
        getTask(taskId),
        listProjects(),
        listCohortUsers(),
      ]);
      setTask(row);
      setProjects(projectRows);
      setUsers(userRows);
      if (row) {
        setTitle(row.title);
        setDescription(row.description);
        setStatus(row.status);
        setAssigneeId(row.assigneeId);
        setProjectId(row.projectId);
        setOutcomeId(row.outcomeId);
        const outcomeRows = await listOutcomesByProject(row.projectId);
        setOutcomes(outcomeRows);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!projectId) {
      setOutcomes([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listOutcomesByProject(projectId);
        if (!cancelled) setOutcomes(rows);
      } catch {
        if (!cancelled) setOutcomes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!task || !user) return;
    setBusy(true);
    setError(null);
    setSavedFlash(false);
    try {
      await updateTask(
        taskId,
        { title, description, status, assigneeId, projectId, outcomeId },
        task,
        user.uid,
      );
      await refresh();
      setSavedFlash(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save task.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading task…</p>;
  }

  if (!task) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-zinc-700">Task not found.</p>
        <Link href="/tasks" className="text-sm text-zinc-600 underline">
          Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/tasks" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Tasks
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit task</h1>
        <p className="text-sm text-zinc-500">
          Status, assignee, and title changes bump <code>lastMovedAt</code>.
          Link an outcome so work maps to a meaningful goal.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      {savedFlash && !error && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Saved.
        </p>
      )}

      <form
        onSubmit={onSave}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700">Project</span>
          <select
            required
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setOutcomeId(null);
            }}
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          >
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.status === "archived" ? " (archived)" : ""}
              </option>
            ))}
          </select>
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
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
