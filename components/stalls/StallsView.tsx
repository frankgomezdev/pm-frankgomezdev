"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  loadStallRadar,
  type StallRadarData,
  type StallRadarItem,
} from "@/lib/stalls/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { TASK_STATUSES } from "@/lib/types/task";

function StallCard({ item }: { item: StallRadarItem }) {
  const statusLabel =
    TASK_STATUSES.find((s) => s.value === item.task.status)?.label ??
    item.task.status;

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/tasks/${item.task.id}`}
            className="text-lg font-medium text-zinc-900 hover:underline"
          >
            {item.task.title}
          </Link>
          <p className="mt-1 text-sm text-zinc-500">
            {item.projectTitle} · {statusLabel} ·{" "}
            {item.assigneeLabel ?? "Unassigned"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {item.reasons.map((reason) => (
            <span
              key={reason}
              className={
                reason === "blocked"
                  ? "rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-amber-900"
                  : "rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-700"
              }
            >
              {reason === "blocked" ? "Blocked" : `Quiet ${item.daysQuiet}d`}
            </span>
          ))}
        </div>
      </div>

      {item.task.blockerNote && (
        <p className="mt-3 text-sm text-zinc-700">
          <span className="font-medium">Why stuck: </span>
          {item.task.blockerNote}
        </p>
      )}
      {item.task.nextAction && (
        <p className="mt-1 text-sm text-zinc-700">
          <span className="font-medium">Next action: </span>
          {item.task.nextAction}
        </p>
      )}

      {item.unblockedBy.length > 0 && (
        <div className="mt-3 text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">Unblocked by</p>
          <ul className="mt-1 list-inside list-disc">
            {item.unblockedBy.map((up) => (
              <li key={up.taskId}>
                <Link
                  href={`/tasks/${up.taskId}`}
                  className="underline hover:text-zinc-900"
                >
                  {up.title}
                </Link>
                {up.assigneeLabel ? ` (${up.assigneeLabel})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.unblocks.length > 0 && (
        <div className="mt-3 text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">Unblocks</p>
          <ul className="mt-1 list-inside list-disc">
            {item.unblocks.map((down) => (
              <li key={down.taskId}>
                <Link
                  href={`/tasks/${down.taskId}`}
                  className="underline hover:text-zinc-900"
                >
                  {down.title}
                </Link>
                {down.assigneeLabel ? ` (${down.assigneeLabel})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <Link
          href={`/tasks/${item.task.id}`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Open task
        </Link>
      </div>
    </li>
  );
}

export function StallsView() {
  const { profile } = useAuth();
  const threshold =
    profile?.preferences.stallDaysThreshold &&
    profile.preferences.stallDaysThreshold > 0
      ? profile.preferences.stallDaysThreshold
      : 3;

  const [data, setData] = useState<StallRadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const next = await loadStallRadar(threshold);
      setData(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load stall radar.",
      );
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading stalls…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stalls</h1>
        <p className="text-zinc-600">
          Quiet tasks (no movement for {threshold}+ days) and blocked work —
          with who/what unblocks whom.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}

      {!data || data.items.length === 0 ? (
        <EmptyState
          title="Nothing stalled or blocked"
          description="Leave a task quiet past your stall threshold, or add a blocker note on a task detail to see it here."
          actionHref="/tasks"
          actionLabel="Browse tasks"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.items.map((item) => (
            <StallCard key={item.task.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
