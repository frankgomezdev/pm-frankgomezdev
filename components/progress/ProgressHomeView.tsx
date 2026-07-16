"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { activityCreatedAtMs } from "@/lib/activity/api";
import {
  loadProgressHome,
  type OutcomeProgress,
  type ProgressHomeData,
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

function ActivityList({
  items,
  empty,
}: {
  items: ActivityEvent[];
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500">
        {empty}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((event) => (
        <li
          key={event.id}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2"
        >
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
      <p className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500">
        No open outcomes yet. Add outcomes on a project and link tasks to see
        team progress here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map(({ outcome, doneCount, totalCount }) => {
        const pct =
          totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
        return (
          <li
            key={outcome.id}
            className="rounded-md border border-zinc-200 bg-white px-3 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                href={`/projects/${outcome.projectId}`}
                className="font-medium text-zinc-900 hover:underline"
              >
                {outcome.title}
              </Link>
              <span className="text-sm text-zinc-600">
                {doneCount}/{totalCount} tasks done
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-800"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Coordination view — not a ranking.
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function ProgressHomeView() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<ProgressHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const next = await loadProgressHome(user.uid);
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
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading progress…</p>;
  }

  const feed =
    data && data.myToday.length > 0 ? data.myToday : (data?.myRecent ?? []);
  const feedLabel =
    data && data.myToday.length > 0
      ? "What you moved forward today"
      : "What you moved forward recently";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="text-zinc-600">
          {profile?.displayName
            ? `Hi ${profile.displayName} — here’s momentum on meaningful work.`
            : "Momentum on meaningful work — not a scoreboard."}
        </p>
        {profile?.preferences.homeView === "tasks" && (
          <p className="mt-2 text-sm text-zinc-500">
            Your preference prefers the task list.{" "}
            <Link href="/tasks" className="underline">
              Go to Tasks
            </Link>{" "}
            (settings toggle lands in C4).
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">{feedLabel}</h2>
        <ActivityList
          items={feed}
          empty="No moves yet. Create a task or change a status — it’ll show up here."
        />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Team outcomes
          </h2>
          <p className="text-sm text-zinc-500">
            Shared progress toward open outcomes (done / total linked tasks).
          </p>
        </div>
        <OutcomeStrip rows={data?.outcomeProgress ?? []} />
      </section>
    </div>
  );
}
