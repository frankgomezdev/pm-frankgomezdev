"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { cardPaddingClassName } from "@/components/ui/cardStyles";
import {
  createProject,
  listProjects,
  setProjectStatus,
  updateProject,
} from "@/lib/projects/api";
import type { Project } from "@/lib/types/project";

type Draft = { title: string; description: string };

const emptyDraft: Draft = { title: "", description: "" };

export function ProjectsView() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [createDraft, setCreateDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const rows = await listProjects();
      setProjects(rows);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects. Check Firestore rules.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = useMemo(
    () =>
      projects.filter((p) =>
        showArchived ? p.status === "archived" : p.status === "active",
      ),
    [projects, showArchived],
  );

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await createProject(createDraft, user.uid);
      setCreateDraft(emptyDraft);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(project: Project) {
    setEditingId(project.id);
    setEditDraft({ title: project.title, description: project.description });
  }

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setBusy(true);
    setError(null);
    try {
      await updateProject(editingId, editDraft);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update project.");
    } finally {
      setBusy(false);
    }
  }

  async function onArchive(projectId: string) {
    setBusy(true);
    setError(null);
    try {
      await setProjectStatus(projectId, "archived");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive project.");
    } finally {
      setBusy(false);
    }
  }

  async function onRestore(projectId: string) {
    setBusy(true);
    setError(null);
    try {
      await setProjectStatus(projectId, "active");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore project.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading projects…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-zinc-600">
            Create, edit, and archive cohort projects.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      {!showArchived && (
        <form
          onSubmit={onCreate}
          className={`flex flex-col gap-3 ${cardPaddingClassName}`}
        >
          <h2 className="text-sm font-semibold text-zinc-900">New project</h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Title</span>
            <input
              required
              value={createDraft.title}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, title: e.target.value }))
              }
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              placeholder="e.g. Phase 1 Project 1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Description</span>
            <textarea
              value={createDraft.description}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, description: e.target.value }))
              }
              rows={3}
              className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              placeholder="What this project is for"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-fit rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Create project"}
          </button>
        </form>
      )}

      <ul className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <li>
            <EmptyState
              title={
                showArchived ? "No archived projects" : "No active projects yet"
              }
              description={
                showArchived
                  ? "Archive a project from the list when you’re done with it."
                  : "Create a project above to start grouping outcomes and tasks."
              }
            />
          </li>
        ) : (
          visible.map((project) => (
          <li
            key={project.id}
            className={cardPaddingClassName}
          >
            {editingId === project.id ? (
              <form onSubmit={onSaveEdit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-700">Title</span>
                  <input
                    required
                    value={editDraft.title}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, title: e.target.value }))
                    }
                    className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-700">Description</span>
                  <textarea
                    value={editDraft.description}
                    onChange={(e) =>
                      setEditDraft((d) => ({
                        ...d,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                  />
                </label>
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
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-lg font-medium text-zinc-900 hover:underline"
                  >
                    {project.title}
                  </Link>
                  {project.description ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
                      {project.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm italic text-zinc-400">
                      No description
                    </p>
                  )}
                  <p className="mt-2 text-xs uppercase tracking-wide text-zinc-400">
                    {project.status}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    Open
                  </Link>
                  {project.status === "active" && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => startEdit(project)}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onArchive(project.id)}
                        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                      >
                        Archive
                      </button>
                    </>
                  )}
                  {project.status === "archived" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onRestore(project.id)}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
          ))
        )}
      </ul>
    </div>
  );
}
