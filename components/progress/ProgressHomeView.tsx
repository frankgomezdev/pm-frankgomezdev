"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { cardPaddingClassName } from "@/components/ui/cardStyles";
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
        <div key={tile.label} className={`${cardPaddingClassName} py-3`}>
          <p className="text-2xl font-semibold tracking-tight text-zinc-900">
            {tile.value}
          </p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
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
    <ul className="flex flex-col gap-2">
      {items.map((event) => (
        <li key={event.id} className={`${cardPaddingClassName} px-3 py-2.5`}>
          <p className="text-sm text-zinc-900">{event.message}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{formatWhen(event)}</span>
            {event.taskId && (
              <Link
                href={`/tasks/${event.taskId}`}
                className="underline hover:text-zinc-800"
              >
                Open task
              </Link>
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
        description="Add outcomes on a project and link tasks so the team can see shared progress — coordination, not ranking."
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
          <li key={outcome.id} className={`${cardPaddingClassName} py-3.5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                href={`/projects/${outcome.projectId}`}
                className="font-medium text-zinc-900 hover:underline"
              >
                {outcome.title}
              </Link>
              <span className="text-sm tabular-nums text-zinc-600">
                {doneCount}/{totalCount} · {pct}%
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-sky-500 transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              Coordination view — not a ranking.
            </p>
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
    <form
      onSubmit={onSubmit}
      className={`flex flex-col gap-3 ${cardPaddingClassName}`}
    >
      <div>
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          End-of-day reflection
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          What moved forward, and who did it help? Informational only — not a
          score.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        placeholder="e.g. Unblocked Priya on login UI by finishing Auth."
      />
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !text.trim()}
        className="w-fit rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save reflection"}
      </button>
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
    return (
      <p className="text-sm text-zinc-500">Opening your preferred Tasks view…</p>
    );
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading progress…</p>;
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
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-zinc-600">
          {profile?.displayName
            ? `Hi ${profile.displayName} — here’s momentum on meaningful work.`
            : "Momentum on meaningful work — not a scoreboard."}
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      <StatsStrip stats={data?.stats ?? emptyStats} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              Team outcomes
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              Shared progress toward open outcomes (done / total linked tasks).
            </p>
          </div>
          <OutcomeStrip rows={data?.outcomeProgress ?? []} />
        </section>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              {feedLabel}
            </h2>
            <ActivityList
              items={feed}
              emptyTitle="No moves yet"
              emptyDescription="Create a task or change a status — it’ll show up here as what you moved forward."
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
