"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Link } from "@/components/catalyst/link";
import { Select } from "@/components/catalyst/select";
import { Text, TextLink } from "@/components/catalyst/text";
import { Textarea } from "@/components/catalyst/textarea";
import { useAuth } from "@/components/providers/AuthProvider";
import { OutcomePicker } from "@/components/outcomes/OutcomePicker";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";
import { GoalQualityNudge } from "@/components/tasks/GoalQualityNudge";
import { ErrorBanner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { listAllOutcomes } from "@/lib/outcomes/api";
import { listProjects } from "@/lib/projects/api";
import { createTask, listTasks } from "@/lib/tasks/api";
import { listCohortUsers, type CohortUser } from "@/lib/users/api";
import type { Outcome } from "@/lib/types/outcome";
import type { Project } from "@/lib/types/project";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types/task";

const defaultStatus: TaskStatus = "todo";

type FilterState = {
  projectId: string; // "" = all
  status: string; // "" = all
  assigneeId: string; // "" = all, "unassigned" = none
};

export function TasksView() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<CohortUser[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [outcomeId, setOutcomeId] = useState<string | null>(null);

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

  const outcomeById = useMemo(() => {
    const map = new Map<string, Outcome>();
    for (const o of outcomes) map.set(o.id, o);
    return map;
  }, [outcomes]);

  const createOutcomes = useMemo(
    () => outcomes.filter((o) => o.projectId === projectId),
    [outcomes, projectId],
  );

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
      const [taskRows, projectRows, userRows, outcomeRows] = await Promise.all([
        listTasks(),
        listProjects(),
        listCohortUsers(),
        listAllOutcomes(),
      ]);
      setTasks(taskRows);
      setProjects(projectRows);
      setUsers(userRows);
      setOutcomes(outcomeRows);
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

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const raw = new FormData(event.currentTarget).get("outcomeId");
    const submittedOutcomeId =
      typeof raw === "string" && raw.trim() ? raw.trim() : null;
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
      setStatus(defaultStatus);
      setAssigneeId(null);
      setOutcomeId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <Text>Loading tasks…</Text>;
  }

  const filtersActive = Boolean(
    filters.projectId || filters.status || filters.assigneeId,
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Heading>Tasks</Heading>
        <Text className="mt-1">
          Create tasks and filter by project, status, or assignee.
        </Text>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <form onSubmit={onCreate} className="flex flex-col gap-4">
        <Subheading level={2}>New task</Subheading>

        {activeProjects.length === 0 ? (
          <Text>
            Create an active project first on{" "}
            <TextLink href="/projects">Projects</TextLink>.
          </Text>
        ) : (
          <>
            <Field>
              <Label>Project</Label>
              <Select
                required
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setOutcomeId(null);
                }}
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Title</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Wire Firebase auth"
              />
            </Field>
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
            <Field>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Field>
            <Field>
              <Label>Outcome</Label>
              <OutcomePicker
                outcomes={createOutcomes}
                value={outcomeId}
                onChange={setOutcomeId}
                disabled={busy}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <Label>Status</Label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <Label>Assignee</Label>
                <AssigneePicker
                  users={users}
                  value={assigneeId}
                  onChange={setAssigneeId}
                  disabled={busy}
                />
              </Field>
            </div>
            <Button
              type="submit"
              disabled={busy || !projectId}
              className="w-fit"
            >
              {busy ? "Saving…" : "Create task"}
            </Button>
          </>
        )}
      </form>

      <Divider soft />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Subheading level={2}>Filters</Subheading>
          {filtersActive && (
            <Button type="button" plain onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <Label>Project</Label>
            <Select
              value={filters.projectId}
              onChange={(e) => updateFilters({ projectId: e.target.value })}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.status === "archived" ? " (archived)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label>Status</Label>
            <Select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
            >
              <option value="">All statuses</option>
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label>Assignee</Label>
            <Select
              value={filters.assigneeId}
              onChange={(e) => updateFilters({ assigneeId: e.target.value })}
            >
              <option value="">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Text className="text-xs/5">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </Text>
      </section>

      <ul className="flex flex-col gap-6">
        {filteredTasks.length === 0 ? (
          <li>
            <EmptyState
              title={
                tasks.length === 0 ? "No tasks yet" : "No matching tasks"
              }
              description={
                tasks.length === 0
                  ? "Create a task above, or open a project and add work there."
                  : "Try clearing filters or choosing a different project/status/assignee."
              }
              actionHref={tasks.length === 0 ? "/projects" : undefined}
              actionLabel={tasks.length === 0 ? "Go to Projects" : undefined}
            />
          </li>
        ) : (
          filteredTasks.map((task, index) => {
            const project = projectById.get(task.projectId);
            const assignee = task.assigneeId
              ? userById.get(task.assigneeId)
              : null;
            const outcome = task.outcomeId
              ? outcomeById.get(task.outcomeId)
              : null;
            return (
              <li key={task.id} className="flex flex-col gap-6">
                {index > 0 && <Divider soft />}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-lg font-medium text-zinc-950 hover:underline dark:text-white"
                      >
                        {task.title}
                      </Link>
                      <StatusPill status={task.status} />
                    </div>
                    <Text className="mt-1">
                      {project?.title ?? "Unknown project"} ·{" "}
                      {assignee ? assignee.displayName : "Unassigned"}
                      {outcome ? ` · ${outcome.title}` : " · No outcome"}
                    </Text>
                  </div>
                  <Button href={`/tasks/${task.id}`} outline className="shrink-0">
                    Open
                  </Button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
