"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Subheading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Select } from "@/components/catalyst/select";
import { Text } from "@/components/catalyst/text";
import { Textarea } from "@/components/catalyst/textarea";
import { useAuth } from "@/components/providers/AuthProvider";
import { ErrorBanner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { createOutcome, updateOutcome } from "@/lib/outcomes/api";
import {
  OUTCOME_STATUSES,
  type Outcome,
  type OutcomeStatus,
} from "@/lib/types/outcome";

type Props = {
  projectId: string;
  projectActive: boolean;
  outcomes: Outcome[];
  loading: boolean;
  onOutcomesChanged: () => Promise<void>;
};

export function ProjectOutcomesSection({
  projectId,
  projectActive,
  outcomes,
  loading,
  onOutcomesChanged,
}: Props) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<OutcomeStatus>("open");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<OutcomeStatus>("open");

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await createOutcome(
        projectId,
        { title, description, status },
        user.uid,
      );
      setTitle("");
      setDescription("");
      setStatus("open");
      await onOutcomesChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create outcome.",
      );
    } finally {
      setBusy(false);
    }
  }

  function startEdit(outcome: Outcome) {
    setEditingId(outcome.id);
    setEditTitle(outcome.title);
    setEditDescription(outcome.description);
    setEditStatus(outcome.status);
  }

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setBusy(true);
    setError(null);
    try {
      await updateOutcome(editingId, {
        title: editTitle,
        description: editDescription,
        status: editStatus,
      });
      setEditingId(null);
      await onOutcomesChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update outcome.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <Subheading level={2}>Outcomes</Subheading>
        <Text className="mt-1">
          Meaningful goals tasks contribute to (e.g. “Ship Project 2 comms”).
        </Text>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {projectActive && (
        <>
          <Divider soft />
          <form onSubmit={onCreate} className="flex flex-col gap-4">
            <Subheading level={3} className="text-sm/6">
              Add outcome
            </Subheading>
            <Field>
              <Label>Title</Label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Review week complete"
              />
            </Field>
            <Field>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </Field>
            <Field>
              <Label>Status</Label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as OutcomeStatus)}
              >
                {OUTCOME_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={busy} className="w-fit">
              {busy ? "Saving…" : "Add outcome"}
            </Button>
          </form>
        </>
      )}

      {loading ? (
        <Text>Loading outcomes…</Text>
      ) : outcomes.length === 0 ? (
        <EmptyState
          title="No outcomes yet"
          description="Add a meaningful goal above so tasks can link to shared progress."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {outcomes.map((outcome) =>
            editingId === outcome.id ? (
              <li
                key={outcome.id}
                className="rounded-lg border border-zinc-950/10 p-4 dark:border-white/10"
              >
                <form onSubmit={onSaveEdit} className="flex flex-col gap-4">
                  <Field>
                    <Label>Title</Label>
                    <Input
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <Label>Description</Label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                    />
                  </Field>
                  <Field>
                    <Label>Status</Label>
                    <Select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as OutcomeStatus)
                      }
                    >
                      {OUTCOME_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      outline
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={outcome.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-zinc-950/10 px-4 py-3 dark:border-white/10"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-950 dark:text-white">
                      {outcome.title}
                    </span>
                    <Badge color={outcome.status === "open" ? "sky" : "emerald"}>
                      {outcome.status}
                    </Badge>
                  </div>
                  {outcome.description ? (
                    <Text className="mt-0.5">{outcome.description}</Text>
                  ) : null}
                </div>
                <Button
                  type="button"
                  outline
                  disabled={busy}
                  onClick={() => startEdit(outcome)}
                >
                  Edit
                </Button>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
