"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Checkbox, CheckboxField } from "@/components/catalyst/checkbox";
import { Divider } from "@/components/catalyst/divider";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Link } from "@/components/catalyst/link";
import { Text } from "@/components/catalyst/text";
import { Textarea } from "@/components/catalyst/textarea";
import { useAuth } from "@/components/providers/AuthProvider";
import { ErrorBanner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
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
    return <Text>Loading projects…</Text>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Heading>Projects</Heading>
          <Text className="mt-1">
            Create, edit, and archive cohort projects.
          </Text>
        </div>
        <CheckboxField>
          <Checkbox
            checked={showArchived}
            onChange={(checked) => setShowArchived(checked)}
          />
          <Label>Show archived</Label>
        </CheckboxField>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!showArchived && (
        <form onSubmit={onCreate} className="flex flex-col gap-4">
          <Subheading level={2}>New project</Subheading>
          <Field>
            <Label>Title</Label>
            <Input
              required
              value={createDraft.title}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, title: e.target.value }))
              }
              placeholder="e.g. Phase 1 Project 1"
            />
          </Field>
          <Field>
            <Label>Description</Label>
            <Textarea
              value={createDraft.description}
              onChange={(e) =>
                setCreateDraft((d) => ({ ...d, description: e.target.value }))
              }
              rows={3}
              placeholder="What this project is for"
            />
          </Field>
          <Button type="submit" disabled={busy} className="w-fit">
            {busy ? "Saving…" : "Create project"}
          </Button>
        </form>
      )}

      <Divider soft />

      <ul className="flex flex-col gap-6">
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
          visible.map((project, index) => (
            <li key={project.id} className="flex flex-col gap-6">
              {index > 0 && <Divider soft />}
              {editingId === project.id ? (
                <form onSubmit={onSaveEdit} className="flex flex-col gap-4">
                  <Field>
                    <Label>Title</Label>
                    <Input
                      required
                      value={editDraft.title}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, title: e.target.value }))
                      }
                    />
                  </Field>
                  <Field>
                    <Label>Description</Label>
                    <Textarea
                      value={editDraft.description}
                      onChange={(e) =>
                        setEditDraft((d) => ({
                          ...d,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                    />
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
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-lg font-medium text-zinc-950 hover:underline dark:text-white"
                      >
                        {project.title}
                      </Link>
                      <Badge
                        color={project.status === "active" ? "lime" : "zinc"}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    {project.description ? (
                      <Text className="mt-1 whitespace-pre-wrap">
                        {project.description}
                      </Text>
                    ) : (
                      <Text className="mt-1 italic">No description</Text>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button href={`/projects/${project.id}`} outline>
                      Open
                    </Button>
                    {project.status === "active" && (
                      <>
                        <Button
                          type="button"
                          outline
                          disabled={busy}
                          onClick={() => startEdit(project)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          outline
                          disabled={busy}
                          onClick={() => void onArchive(project.id)}
                        >
                          Archive
                        </Button>
                      </>
                    )}
                    {project.status === "archived" && (
                      <Button
                        type="button"
                        outline
                        disabled={busy}
                        onClick={() => void onRestore(project.id)}
                      >
                        Restore
                      </Button>
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
