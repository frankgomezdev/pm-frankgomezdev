"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";
import { listProjects } from "@/lib/projects/api";
import { createTask, listTasks } from "@/lib/tasks/api";
import { listCohortUsers, type CohortUser } from "@/lib/users/api";
import type { Project } from "@/lib/types/project";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types/task";

const defaultStatus: TaskStatus = "todo";

type FilterState = {
  projectId: string; // "" = all
  status: string; // "" = all
  assigneeId: string; // "" = all, "unassigned" = none
};

export function TasksView() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<CohortUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const filters: FilterState = useMemo(
    () => ({
      projectId: searchParams.get("project") ?? "",
      status: searchParams.get("status") ?? "",
      assigneeId: searchParams.get("assignee") ?? "",
    }),
    [searchParams],
  );

  const updateFilters = useCallback(
    (patch: Partial<FilterState>) => {
      const next = { ...filters, ...patch };
      const params = new URLSearchParams();
      if (next.projectId) params.set("project", next.projectId);
      if (next.status) params.set("status", next.status);
      if (next.assigneeId) params.set("assignee", next.assigneeId);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const projectById = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  const userById = useMemo(() => {
    const map = new Map<string, CohortUser>();
    for (const u of users) map.set(u.uid, u);
    return map;
  }, [users]);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === "active"),
    [projects],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.projectId && task.projectId !== filters.projectId) {
        return false;
      }
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      if (filters.assigneeId === "unassigned" && task.assigneeId) {
        return false;
      }
      if (
        filters.assigneeId &&
        filters.assigneeId !== "unassigned" &&
        task.assigneeId !== filters.assigneeId
      ) {
        return false;
      }
      return true;
    });
  }, [tasks, filters]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [taskRows, projectRows, userRows] = await Promise.all([
        listTasks(),
        listProjects(),
        listCohortUsers(),
      ]);
      setTasks(taskRows);
      setProjects(projectRows);
      setUsers(userRows);
      setProjectId((current) => {
        if (current) return current;
        const firstActive = projectRows.find((p) => p.status === "active");
        return firstActive?.id ?? "";
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tasks. Check Firestore rules.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await createTask(
        { projectId, title, description, status, assigneeId },
        user.uid,
      );
      setTitle("");
      setDescription("");
      setStatus(defaultStatus);
      setAssigneeId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading tasks…</p>;
  }

  const filtersActive = Boolean(
    filters.projectId || filters.status || filters.assigneeId,
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-zinc-600">
          Create tasks and filter by project, status, or assignee.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      <form
        onSubmit={onCreate}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold text-zinc-900">New task</h2>

        {activeProjects.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Create an active project first on{" "}
            <Link href="/projects" className="underline">
              Projects
            </Link>
            .
          </p>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-700">Project</span>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-700">Title</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                placeholder="e.g. Wire Firebase auth"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-700">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
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
              disabled={busy || !projectId}
              className="w-fit rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Create task"}
            </button>
          </>
        )}
      </form>

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Filters</h2>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-zinc-600 underline hover:text-zinc-900"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Project</span>
            <select
              value={filters.projectId}
              onChange={(e) => updateFilters({ projectId: e.target.value })}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.status === "archived" ? " (archived)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Status</span>
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            >
              <option value="">All statuses</option>
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Assignee</span>
            <select
              value={filters.assigneeId}
              onChange={(e) => updateFilters({ assigneeId: e.target.value })}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            >
              <option value="">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-zinc-500">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </p>
      </section>

      <ul className="flex flex-col gap-3">
        {filteredTasks.length === 0 ? (
          <li className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            {tasks.length === 0
              ? "No tasks yet."
              : "No tasks match these filters."}
          </li>
        ) : (
          filteredTasks.map((task) => {
            const project = projectById.get(task.projectId);
            const assignee = task.assigneeId
              ? userById.get(task.assigneeId)
              : null;
            const statusLabel =
              TASK_STATUSES.find((s) => s.value === task.status)?.label ??
              task.status;
            return (
              <li
                key={task.id}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-lg font-medium text-zinc-900 hover:underline"
                    >
                      {task.title}
                    </Link>
                    <p className="mt-1 text-sm text-zinc-500">
                      {project?.title ?? "Unknown project"} · {statusLabel} ·{" "}
                      {assignee ? assignee.displayName : "Unassigned"}
                    </p>
                  </div>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Open
                  </Link>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
