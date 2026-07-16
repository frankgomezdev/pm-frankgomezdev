"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  createOutcome,
  listOutcomesByProject,
  updateOutcome,
} from "@/lib/outcomes/api";
import {
  OUTCOME_STATUSES,
  type Outcome,
  type OutcomeStatus,
} from "@/lib/types/outcome";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  projectId: string;
  projectActive: boolean;
};

export function ProjectOutcomesSection({ projectId, projectActive }: Props) {
  const { user } = useAuth();
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<OutcomeStatus>("open");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<OutcomeStatus>("open");

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const rows = await listOutcomesByProject(projectId);
      setOutcomes(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load outcomes. Check Firestore rules.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
      await refresh();
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
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update outcome.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Outcomes</h2>
        <p className="text-sm text-zinc-500">
          Meaningful goals tasks contribute to (e.g. “Ship Project 2 comms”) —
          not vanity metrics.
        </p>
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
          <h3 className="text-sm font-medium text-zinc-800">Add outcome</h3>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              placeholder="e.g. Review week complete"
            />
          </label>
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
            <span className="text-zinc-700">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OutcomeStatus)}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
            >
              {OUTCOME_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-fit rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Add outcome"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading outcomes…</p>
      ) : outcomes.length === 0 ? (
        <EmptyState
          title="No outcomes yet"
          description="Add a meaningful goal above so tasks can link to real progress — not vanity metrics."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {outcomes.map((outcome) =>
            editingId === outcome.id ? (
              <li
                key={outcome.id}
                className="rounded-md border border-zinc-200 p-3"
              >
                <form onSubmit={onSaveEdit} className="flex flex-col gap-3">
                  <input
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  />
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as OutcomeStatus)
                    }
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  >
                    {OUTCOME_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={outcome.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{outcome.title}</p>
                  {outcome.description ? (
                    <p className="mt-0.5 text-sm text-zinc-600">
                      {outcome.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                    {outcome.status}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startEdit(outcome)}
                  className="rounded-md border border-zinc-300 px-2.5 py-1 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                >
                  Edit
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
