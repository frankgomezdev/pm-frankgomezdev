"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import { Checkbox, CheckboxField } from "@/components/catalyst/checkbox";
import { Divider } from "@/components/catalyst/divider";
import {
  Description,
  Field,
  Fieldset,
  Label,
  Legend,
} from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Link } from "@/components/catalyst/link";
import { Select } from "@/components/catalyst/select";
import { Code, Text, TextLink } from "@/components/catalyst/text";
import { Textarea } from "@/components/catalyst/textarea";
import { useAuth } from "@/components/providers/AuthProvider";
import { OutcomePicker } from "@/components/outcomes/OutcomePicker";
import { AssigneePicker } from "@/components/tasks/AssigneePicker";
import { GoalQualityNudge } from "@/components/tasks/GoalQualityNudge";
import { ErrorBanner, SuccessBanner } from "@/components/ui/Banner";
import { listOutcomesByProject } from "@/lib/outcomes/api";
import { listProjects } from "@/lib/projects/api";
import { getTask, listTasks, updateTask } from "@/lib/tasks/api";
import { listCohortUsers, type CohortUser } from "@/lib/users/api";
import type { Outcome } from "@/lib/types/outcome";
import type { Project } from "@/lib/types/project";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/lib/types/task";

function readOutcomeIdFromForm(form: HTMLFormElement): string | null {
  const raw = new FormData(form).get("outcomeId");
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

export function TaskDetailView() {
  const params = useParams<{ id: string }>();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, profile } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<CohortUser[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
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
  const [blockedByTaskIds, setBlockedByTaskIds] = useState<string[]>([]);
  const [blockerNote, setBlockerNote] = useState("");
  const [nextAction, setNextAction] = useState("");

  const projectOptions = useMemo(() => {
    if (!task) return projects.filter((p) => p.status === "active");
    const active = projects.filter((p) => p.status === "active");
    const current = projects.find((p) => p.id === task.projectId);
    if (current && current.status === "archived") {
      return [current, ...active];
    }
    return active;
  }, [projects, task]);

  const dependencyCandidates = useMemo(() => {
    return allTasks.filter(
      (t) => t.id !== taskId && t.projectId === projectId && t.status !== "done",
    );
  }, [allTasks, taskId, projectId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [row, projectRows, userRows, taskRows] = await Promise.all([
        getTask(taskId),
        listProjects(),
        listCohortUsers(),
        listTasks(),
      ]);
      setTask(row);
      setProjects(projectRows);
      setUsers(userRows);
      setAllTasks(taskRows);
      if (row) {
        setTitle(row.title);
        setDescription(row.description);
        setStatus(row.status);
        setAssigneeId(row.assigneeId);
        setProjectId(row.projectId);
        setOutcomeId(row.outcomeId);
        setBlockedByTaskIds(row.blockedByTaskIds);
        setBlockerNote(row.blockerNote ?? "");
        setNextAction(row.nextAction ?? "");
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

  function toggleBlockedBy(id: string) {
    setBlockedByTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task || !user) return;
    // Prefer the live <select> value so a controlled/optgroup mismatch cannot
    // silently save null while the UI looked selected.
    const submittedOutcomeId =
      readOutcomeIdFromForm(event.currentTarget) ?? outcomeId;
    setOutcomeId(submittedOutcomeId);
    setBusy(true);
    setError(null);
    setSavedFlash(false);
    try {
      await updateTask(
        taskId,
        {
          title,
          description,
          status,
          assigneeId,
          projectId,
          outcomeId: submittedOutcomeId,
          blockedByTaskIds,
          blockerNote: blockerNote.trim() || null,
          nextAction: nextAction.trim() || null,
        },
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
    return <Text>Loading task…</Text>;
  }

  if (!task) {
    return (
      <div className="flex flex-col gap-3">
        <Text>Task not found.</Text>
        <Text>
          <TextLink href="/tasks">Back to tasks</TextLink>
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/tasks"
          className="text-sm/6 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          ← Tasks
        </Link>
      </div>

      <div>
        <Heading>Edit task</Heading>
        <Text className="mt-1">
          Status, assignee, title, and blocker changes bump{" "}
          <Code>lastMovedAt</Code>. Link an outcome so work maps to a meaningful
          goal.
        </Text>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {savedFlash && !error && <SuccessBanner>Saved.</SuccessBanner>}

      <form onSubmit={onSave} className="flex flex-col gap-4">
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
            rows={4}
          />
        </Field>
        <Field>
          <Label>Project</Label>
          <Select
            required
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setOutcomeId(null);
              setBlockedByTaskIds([]);
            }}
          >
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.status === "archived" ? " (archived)" : ""}
              </option>
            ))}
          </Select>
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

        <Divider soft />

        <Fieldset>
          <Legend>Blockers & next action</Legend>
          <Description>
            Capture why work is stuck and the smallest step to unblock. Cleared
            blockers show on Progress.
          </Description>
          <div className="mt-6 space-y-6">
            <Field>
              <Label>Why stuck</Label>
              <Textarea
                value={blockerNote}
                onChange={(e) => setBlockerNote(e.target.value)}
                rows={2}
                placeholder="Waiting on API access / design decision / …"
              />
            </Field>
            <Field>
              <Label>Next action</Label>
              <Input
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Smallest unblocking step"
              />
            </Field>
            <div className="flex flex-col gap-3">
              <span className="text-base/6 font-medium text-zinc-950 sm:text-sm/6 dark:text-white">
                Blocked by (same project)
              </span>
              {dependencyCandidates.length === 0 ? (
                <Text className="text-xs/5">
                  No other open tasks in this project to depend on.
                </Text>
              ) : (
                <ul className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-950/10 p-3 dark:border-white/10">
                  {dependencyCandidates.map((candidate) => (
                    <li key={candidate.id}>
                      <CheckboxField>
                        <Checkbox
                          checked={blockedByTaskIds.includes(candidate.id)}
                          onChange={() => toggleBlockedBy(candidate.id)}
                          disabled={busy}
                        />
                        <Label>{candidate.title}</Label>
                      </CheckboxField>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Fieldset>

        <Button type="submit" disabled={busy} className="w-fit">
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
