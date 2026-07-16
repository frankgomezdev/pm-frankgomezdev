"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Subheading } from "@/components/catalyst/heading";
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
    <section className="flex flex-col gap-4">
      <div>
        <Subheading level={2}>Tasks</Subheading>
        <Text className="mt-1">
          Tasks in this project.{" "}
          <TextLink href={`/tasks?project=${projectId}`}>
            Open in Tasks with filter
          </TextLink>
        </Text>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {projectActive && (
        <>
          <Divider soft />
          <form onSubmit={onCreate} className="flex flex-col gap-4">
            <Subheading level={3} className="text-sm/6">
              Add task
            </Subheading>
            <Field>
              <Label>Title</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                rows={2}
              />
            </Field>
            <Field>
              <Label>Outcome</Label>
              <OutcomePicker
                outcomes={outcomes}
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
            <Button type="submit" disabled={busy} className="w-fit">
              {busy ? "Saving…" : "Add task"}
            </Button>
          </form>
        </>
      )}

      {loading ? (
        <Text>Loading tasks…</Text>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks in this project"
          description="Add a task above, or create one from the Tasks page with this project selected."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => {
            const assignee = task.assigneeId
              ? userById.get(task.assigneeId)
              : null;
            const outcome = task.outcomeId
              ? outcomeById.get(task.outcomeId)
              : null;
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-950/10 px-4 py-3 dark:border-white/10"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-medium text-zinc-950 hover:underline dark:text-white"
                    >
                      {task.title}
                    </Link>
                    <StatusPill status={task.status} />
                  </div>
                  <Text className="mt-0.5 text-xs/5">
                    {assignee ? assignee.displayName : "Unassigned"}
                    {outcome ? ` · ${outcome.title}` : " · No outcome"}
                  </Text>
                </div>
                <Button href={`/tasks/${task.id}`} outline>
                  Open
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
