"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { seedDemoWorkspace } from "@/lib/seed/demo";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from "@/lib/types/user";
import { normalizePreferences } from "@/lib/users/preferences";

export function SettingsView() {
  const { user, profile, updatePreferences, signOut } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(() =>
    normalizePreferences(profile?.preferences ?? DEFAULT_USER_PREFERENCES),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [seedBusy, setSeedBusy] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(normalizePreferences(profile?.preferences));
  }, [profile?.preferences]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updatePreferences(prefs);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save preferences.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-zinc-600">
          Autonomy controls — no XP, points, or leaderboards.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Preferences saved.
        </p>
      )}

      <form
        onSubmit={onSave}
        className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700">Default home view</span>
          <select
            value={prefs.homeView}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                homeView: e.target.value as UserPreferences["homeView"],
              }))
            }
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          >
            <option value="progress">Progress (recommended)</option>
            <option value="tasks">Tasks list</option>
          </select>
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={prefs.nudgeGoalQuality}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, nudgeGoalQuality: e.target.checked }))
            }
          />
          <span>
            <span className="font-medium text-zinc-800">Goal-quality nudge</span>
            <span className="block text-zinc-500">
              Suggest clearer titles and optional split ideas when a task title
              looks vague.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={prefs.reflectionPromptEnabled}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                reflectionPromptEnabled: e.target.checked,
              }))
            }
          />
          <span>
            <span className="font-medium text-zinc-800">
              End-of-day reflection
            </span>
            <span className="block text-zinc-500">
              Show a short reflection prompt on Progress (writes an activity
              note — not a score).
            </span>
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700">Stall threshold (days)</span>
          <input
            type="number"
            min={1}
            max={30}
            value={prefs.stallDaysThreshold}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                stallDaysThreshold: Number(e.target.value) || 3,
              }))
            }
            className="w-28 rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          />
          <span className="text-xs text-zinc-500">
            Used by Stalls for “quiet” tasks with no movement.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700">Reminder cadence (UI only)</span>
          <select
            value={prefs.reminderCadence}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                reminderCadence: e.target
                  .value as UserPreferences["reminderCadence"],
              }))
            }
            className="rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          >
            <option value="off">Off</option>
            <option value="daily">Daily (preference stored only)</option>
            <option value="weekly">Weekly (preference stored only)</option>
          </select>
          <span className="text-xs text-zinc-500">
            Stored for later — no emails/notifications in v1.
          </span>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-fit rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save preferences"}
        </button>
      </form>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Demo seed</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Creates a sample project, two outcomes, three tasks (one blocked), and
          a reflection activity for reviewers. Safe to run more than once.
        </p>
        {seedMessage && (
          <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {seedMessage}{" "}
            <Link href="/projects" className="underline">
              Open Projects
            </Link>
          </p>
        )}
        {seedError && (
          <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {seedError}
          </p>
        )}
        <button
          type="button"
          disabled={seedBusy || !user}
          onClick={() => {
            if (!user) return;
            setSeedBusy(true);
            setSeedError(null);
            setSeedMessage(null);
            void seedDemoWorkspace(user.uid, user.uid)
              .then((result) => {
                setSeedMessage(
                  `Seeded demo project ${result.projectId.slice(0, 8)}… with ${result.taskIds.length} tasks.`,
                );
              })
              .catch((err) => {
                setSeedError(
                  err instanceof Error ? err.message : "Seed failed.",
                );
              })
              .finally(() => setSeedBusy(false));
          }}
          className="mt-3 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          {seedBusy ? "Seeding…" : "Seed demo project"}
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm text-zinc-600">
          Signed in as{" "}
          <span className="font-medium text-zinc-900">
            {profile?.displayName ?? user?.email ?? "…"}
          </span>
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-3 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
