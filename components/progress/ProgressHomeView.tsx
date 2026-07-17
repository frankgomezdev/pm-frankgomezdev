"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Link } from "@/components/catalyst/link";
import { Text, TextLink } from "@/components/catalyst/text";
import { Textarea } from "@/components/catalyst/textarea";
import { useAuth } from "@/components/providers/AuthProvider";
import { ErrorBanner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { activityCreatedAtMs, logActivity } from "@/lib/activity/api";
import {
  loadProgressHome,
  type OutcomeProgress,
  type ProgressHomeData,
  type ProgressStats,
} from "@/lib/progress/api";
import type { ActivityEvent } from "@/lib/types/activity";

function formatWhen(event: ActivityEvent): string {
  const ms = activityCreatedAtMs(event);
  if (!ms) return "";
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Thin custom bar — approved Phase 0 exception (no Catalyst Progress equivalent). */
function ProgressBar({ percent }: { percent: number }) {
  const width = Math.min(100, Math.max(0, percent));
  return (
    <div
      className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-950/5 dark:bg-white/10"
      role="progressbar"
      aria-valuenow={width}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-sky-500 transition-[width] duration-300"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function StatsStrip({ stats }: { stats: ProgressStats }) {
  const tiles = [
    { label: "To do", value: stats.todoCount },
    { label: "In progress", value: stats.inProgressCount },
    { label: "Done", value: stats.doneCount },
    { label: "Needs attention", value: stats.attentionCount },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-lg border border-zinc-950/10 px-4 py-3 dark:border-white/10"
        >
          <p className="text-2xl/8 font-semibold tracking-tight text-zinc-950 dark:text-white">
            {tile.value}
          </p>
          <p className="mt-0.5 text-xs/5 font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {tile.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function ActivityList({
  items,
  emptyTitle,
  emptyDescription,
  emptyHref,
  emptyAction,
}: {
  items: ActivityEvent[];
  emptyTitle: string;
  emptyDescription: string;
  emptyHref?: string;
  emptyAction?: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionHref={emptyHref}
        actionLabel={emptyAction}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((event) => (
        <li
          key={event.id}
          className="rounded-lg border border-zinc-950/10 px-4 py-3 dark:border-white/10"
        >
          <Text className="text-zinc-950 dark:text-white">{event.message}</Text>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs/5 text-zinc-500 dark:text-zinc-400">
            <span>{formatWhen(event)}</span>
            {event.taskId && (
              <TextLink href={`/tasks/${event.taskId}`}>Open task</TextLink>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function OutcomeStrip({ rows }: { rows: OutcomeProgress[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No open outcomes yet"
        description="Add outcomes on a project and link tasks so the team can see shared progress."
        actionHref="/projects"
        actionLabel="Go to Projects"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map(({ outcome, doneCount, totalCount }) => {
        const pct =
          totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
        return (
          <li
            key={outcome.id}
            className="rounded-lg border border-zinc-950/10 px-4 py-3.5 dark:border-white/10"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                href={`/projects/${outcome.projectId}`}
                className="font-medium text-zinc-950 hover:underline dark:text-white"
              >
                {outcome.title}
              </Link>
              <span className="text-sm/6 tabular-nums text-zinc-600 dark:text-zinc-400">
                {doneCount}/{totalCount} · {pct}%
              </span>
            </div>
            <ProgressBar percent={pct} />
          </li>
        );
      })}
    </ul>
  );
}

function ReflectionPrompt({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await logActivity({
        type: "reflection",
        actorId: user.uid,
        projectId: "",
        taskId: null,
        outcomeId: null,
        message: `Reflection: ${trimmed}`,
      });
      setText("");
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save reflection.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Subheading level={2}>End-of-day reflection</Subheading>
        <Text className="mt-0.5">
          What moved forward, and who did it help?
        </Text>
      </div>
      <Field>
        <Label className="sr-only">Reflection</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="e.g. Unblocked Priya on login UI by finishing Auth."
        />
      </Field>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <Button
        type="submit"
        disabled={busy || !text.trim()}
        className="w-fit"
      >
        {busy ? "Saving…" : "Save reflection"}
      </Button>
    </form>
  );
}

export function ProgressHomeView() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProgressHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stallThreshold =
    profile?.preferences.stallDaysThreshold &&
    profile.preferences.stallDaysThreshold > 0
      ? profile.preferences.stallDaysThreshold
      : 3;

  useEffect(() => {
    if (profile?.preferences.homeView === "tasks") {
      router.replace("/tasks");
    }
  }, [profile?.preferences.homeView, router]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const next = await loadProgressHome(user.uid, stallThreshold);
      setData(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load progress. Check Firestore rules for activity.",
      );
    } finally {
      setLoading(false);
    }
  }, [user, stallThreshold]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (profile?.preferences.homeView === "tasks") {
    return <Text>Opening your preferred Tasks view…</Text>;
  }

  if (loading) {
    return <Text>Loading progress…</Text>;
  }

  const feed =
    data && data.myToday.length > 0 ? data.myToday : (data?.myRecent ?? []);
  const feedLabel =
    data && data.myToday.length > 0
      ? "What you moved forward today"
      : "What you moved forward recently";

  const emptyStats: ProgressStats = {
    todoCount: 0,
    inProgressCount: 0,
    doneCount: 0,
    attentionCount: 0,
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Heading>Progress</Heading>
        <Text className="mt-1">
          {profile?.displayName
            ? `Hi ${profile.displayName}. Here’s momentum on meaningful work.`
            : "Momentum on meaningful work."}
        </Text>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <StatsStrip stats={data?.stats ?? emptyStats} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <section className="flex flex-col gap-3">
          <div>
            <Subheading level={2}>Team outcomes</Subheading>
            <Text className="mt-0.5">
              Shared progress toward open outcomes (done / total linked tasks).
            </Text>
          </div>
          <OutcomeStrip rows={data?.outcomeProgress ?? []} />
        </section>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <Subheading level={2}>{feedLabel}</Subheading>
            <ActivityList
              items={feed}
              emptyTitle="No moves yet"
              emptyDescription="Create a task or change a status. It’ll show up here as what you moved forward."
              emptyHref="/tasks"
              emptyAction="Go to Tasks"
            />
          </section>

          {profile?.preferences.reflectionPromptEnabled && (
            <ReflectionPrompt onSaved={() => void refresh()} />
          )}
        </div>
      </div>
    </div>
  );
}
