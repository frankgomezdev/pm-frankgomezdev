"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Link } from "@/components/catalyst/link";
import { Text, TextLink } from "@/components/catalyst/text";
import { Textarea } from "@/components/catalyst/textarea";
import { ErrorBanner } from "@/components/ui/Banner";
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
    return <Text>Loading project…</Text>;
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-3">
        <Text>Project not found.</Text>
        <Text>
          <TextLink href="/projects">Back to projects</TextLink>
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/projects"
          className="text-sm/6 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          ← Projects
        </Link>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {editing ? (
        <form onSubmit={onSave} className="flex flex-col gap-4">
          <Field>
            <Label>Title</Label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              Save
            </Button>
            <Button
              type="button"
              outline
              onClick={() => {
                setEditing(false);
                setTitle(project.title);
                setDescription(project.description);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Heading>{project.title}</Heading>
                <Badge color={project.status === "active" ? "lime" : "zinc"}>
                  {project.status}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                outline
                disabled={busy}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
              <Button
                type="button"
                outline
                disabled={busy}
                onClick={() => void onToggleArchive()}
              >
                {project.status === "active" ? "Archive" : "Restore"}
              </Button>
            </div>
          </div>
          {project.description ? (
            <Text className="whitespace-pre-wrap">{project.description}</Text>
          ) : (
            <Text className="italic">No description</Text>
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
