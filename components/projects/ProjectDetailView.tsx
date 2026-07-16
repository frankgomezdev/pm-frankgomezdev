"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getProject,
  setProjectStatus,
  updateProject,
} from "@/lib/projects/api";
import { listOutcomesByProject } from "@/lib/outcomes/api";
import type { Outcome } from "@/lib/types/outcome";
import type { Project } from "@/lib/types/project";
import { ProjectOutcomesSection } from "@/components/projects/ProjectOutcomesSection";
import { ProjectTasksSection } from "@/components/projects/ProjectTasksSection";

export function ProjectDetailView() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [outcomesLoading, setOutcomesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshOutcomes = useCallback(async () => {
    setOutcomesLoading(true);
    try {
      const rows = await listOutcomesByProject(projectId);
      setOutcomes(rows);
    } catch {
      setOutcomes([]);
    } finally {
      setOutcomesLoading(false);
    }
  }, [projectId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const row = await getProject(projectId);
      setProject(row);
      if (row) {
        setTitle(row.title);
        setDescription(row.description);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void refreshOutcomes();
  }, [refreshOutcomes]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updateProject(projectId, { title, description });
      setEditing(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save project.");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleArchive() {
    if (!project) return;
    setBusy(true);
    setError(null);
    try {
      await setProjectStatus(
        projectId,
        project.status === "active" ? "archived" : "active",
      );
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update project status.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading project…</p>;
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-zinc-700">Project not found.</p>
        <Link href="/projects" className="text-sm text-zinc-600 underline">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/projects"
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← Projects
        </Link>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      {editing ? (
        <form onSubmit={onSave} className="flex flex-col gap-3">
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
              onClick={() => {
                setEditing(false);
                setTitle(project.title);
                setDescription(project.description);
              }}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.title}
              </h1>
              <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                {project.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(true)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onToggleArchive()}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-60"
              >
                {project.status === "active" ? "Archive" : "Restore"}
              </button>
            </div>
          </div>
          {project.description ? (
            <p className="whitespace-pre-wrap text-zinc-600">
              {project.description}
            </p>
          ) : (
            <p className="italic text-zinc-400">No description</p>
          )}
        </div>
      )}

      <ProjectOutcomesSection
        projectId={project.id}
        projectActive={project.status === "active"}
        outcomes={outcomes}
        loading={outcomesLoading}
        onOutcomesChanged={refreshOutcomes}
      />

      <ProjectTasksSection
        projectId={project.id}
        projectActive={project.status === "active"}
        outcomes={outcomes}
      />
    </div>
  );
}
