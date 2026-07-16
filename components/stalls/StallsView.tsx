"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Heading } from "@/components/catalyst/heading";
import { Link } from "@/components/catalyst/link";
import { Strong, Text, TextLink } from "@/components/catalyst/text";
import { useAuth } from "@/components/providers/AuthProvider";
import { ErrorBanner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { FlagPill, StatusPill } from "@/components/ui/StatusPill";
import {
  loadStallRadar,
  type StallRadarData,
  type StallRadarItem,
} from "@/lib/stalls/api";

function StallCard({ item }: { item: StallRadarItem }) {
  return (
    <div className="rounded-lg border border-zinc-950/10 p-4 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/tasks/${item.task.id}`}
              className="text-lg font-medium text-zinc-950 hover:underline dark:text-white"
            >
              {item.task.title}
            </Link>
            <StatusPill status={item.task.status} />
          </div>
          <Text className="mt-1">
            {item.projectTitle} · {item.assigneeLabel ?? "Unassigned"}
          </Text>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {item.reasons.map((reason) => (
            <FlagPill
              key={reason}
              kind={reason === "blocked" ? "blocked" : "quiet"}
              daysQuiet={reason !== "blocked" ? item.daysQuiet : undefined}
            />
          ))}
        </div>
      </div>

      {item.task.blockerNote && (
        <Text className="mt-3 text-zinc-950 dark:text-white">
          <Strong>Why stuck: </Strong>
          {item.task.blockerNote}
        </Text>
      )}
      {item.task.nextAction && (
        <Text className="mt-1 text-zinc-950 dark:text-white">
          <Strong>Next action: </Strong>
          {item.task.nextAction}
        </Text>
      )}

      {item.unblockedBy.length > 0 && (
        <div className="mt-3">
          <Text>
            <Strong>Unblocked by</Strong>
          </Text>
          <ul className="mt-1 list-inside list-disc text-sm/6 text-zinc-600 dark:text-zinc-400">
            {item.unblockedBy.map((up) => (
              <li key={up.taskId}>
                <TextLink href={`/tasks/${up.taskId}`}>{up.title}</TextLink>
                {up.assigneeLabel ? ` (${up.assigneeLabel})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.unblocks.length > 0 && (
        <div className="mt-3">
          <Text>
            <Strong>Unblocks</Strong>
          </Text>
          <ul className="mt-1 list-inside list-disc text-sm/6 text-zinc-600 dark:text-zinc-400">
            {item.unblocks.map((down) => (
              <li key={down.taskId}>
                <TextLink href={`/tasks/${down.taskId}`}>{down.title}</TextLink>
                {down.assigneeLabel ? ` (${down.assigneeLabel})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <Button href={`/tasks/${item.task.id}`} outline>
          Open task
        </Button>
      </div>
    </div>
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
    return <Text>Loading stalls…</Text>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Heading>Stalls</Heading>
        <Text className="mt-1">
          Quiet tasks (no movement for {threshold}+ days) and blocked work —
          with who/what unblocks whom.
        </Text>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!data || data.items.length === 0 ? (
        <EmptyState
          title="Nothing stalled or blocked"
          description="Leave a task quiet past your stall threshold, or add a blocker note on a task detail to see it here."
          actionHref="/tasks"
          actionLabel="Browse tasks"
        />
      ) : (
        <ul className="flex flex-col gap-6">
          {data.items.map((item, index) => (
            <li key={item.task.id} className="flex flex-col gap-6">
              {index > 0 && <Divider soft />}
              <StallCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
