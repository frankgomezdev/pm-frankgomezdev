"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/catalyst/button";
import {
  Checkbox,
  CheckboxField,
} from "@/components/catalyst/checkbox";
import { Divider } from "@/components/catalyst/divider";
import {
  Description,
  Field,
  Label,
} from "@/components/catalyst/fieldset";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Select } from "@/components/catalyst/select";
import { Text, TextLink } from "@/components/catalyst/text";
import { useAuth } from "@/components/providers/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/ui/Banner";
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
    <div className="flex flex-col gap-8">
      <div>
        <Heading>Settings</Heading>
        <Text className="mt-1">
          Autonomy controls — no XP, points, or leaderboards.
        </Text>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {saved && !error && (
        <SuccessBanner>Preferences saved.</SuccessBanner>
      )}

      <form onSubmit={onSave} className="flex flex-col gap-6">
        <Field>
          <Label>Default home view</Label>
          <Select
            value={prefs.homeView}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                homeView: e.target.value as UserPreferences["homeView"],
              }))
            }
          >
            <option value="progress">Progress (recommended)</option>
            <option value="tasks">Tasks list</option>
          </Select>
        </Field>

        <CheckboxField>
          <Checkbox
            checked={prefs.nudgeGoalQuality}
            onChange={(checked) =>
              setPrefs((p) => ({ ...p, nudgeGoalQuality: checked }))
            }
          />
          <Label>Goal-quality nudge</Label>
          <Description>
            Suggest clearer titles and optional split ideas when a task title
            looks vague.
          </Description>
        </CheckboxField>

        <CheckboxField>
          <Checkbox
            checked={prefs.reflectionPromptEnabled}
            onChange={(checked) =>
              setPrefs((p) => ({
                ...p,
                reflectionPromptEnabled: checked,
              }))
            }
          />
          <Label>End-of-day reflection</Label>
          <Description>
            Show a short reflection prompt on Progress (writes an activity note
            — not a score).
          </Description>
        </CheckboxField>

        <Field>
          <Label>Stall threshold (days)</Label>
          <Input
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
            className="w-28"
          />
          <Description>
            Used by Stalls for “quiet” tasks with no movement.
          </Description>
        </Field>

        <Field>
          <Label>Reminder cadence (UI only)</Label>
          <Select
            value={prefs.reminderCadence}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                reminderCadence: e.target
                  .value as UserPreferences["reminderCadence"],
              }))
            }
          >
            <option value="off">Off</option>
            <option value="daily">Daily (preference stored only)</option>
            <option value="weekly">Weekly (preference stored only)</option>
          </Select>
          <Description>
            Stored for later — no emails/notifications in v1.
          </Description>
        </Field>

        <Button type="submit" disabled={busy} className="w-fit">
          {busy ? "Saving…" : "Save preferences"}
        </Button>
      </form>

      <Divider soft />

      <div className="flex flex-col gap-3">
        <Subheading level={2}>Demo seed</Subheading>
        <Text>
          Creates a sample project, two outcomes, three tasks (one blocked), and
          a reflection activity for reviewers. Safe to run more than once.
        </Text>
        {seedMessage && (
          <SuccessBanner>
            {seedMessage}{" "}
            <TextLink href="/projects">Open Projects</TextLink>
          </SuccessBanner>
        )}
        {seedError && <ErrorBanner>{seedError}</ErrorBanner>}
        <Button
          type="button"
          outline
          disabled={seedBusy || !user}
          onClick={() => {
            if (!user) return;
            setSeedBusy(true);
            setSeedError(null);
            setSeedMessage(null);
            void seedDemoWorkspace(user.uid, user.uid)
              .then((result) => {
                setSeedMessage(
                  result.alreadyExisted
                    ? `Demo project already exists (${result.projectId.slice(0, 8)}…). Open Projects to use it, or archive it first to re-seed.`
                    : `Seeded demo project ${result.projectId.slice(0, 8)}… with ${result.taskIds.length} tasks.`,
                );
              })
              .catch((err) => {
                setSeedError(
                  err instanceof Error ? err.message : "Seed failed.",
                );
              })
              .finally(() => setSeedBusy(false));
          }}
          className="w-fit"
        >
          {seedBusy ? "Seeding…" : "Seed demo project"}
        </Button>
      </div>

      <Divider soft />

      <div className="flex flex-col gap-3">
        <Text>
          Signed in as{" "}
          <span className="font-medium text-zinc-950 dark:text-white">
            {profile?.displayName ?? user?.email ?? "…"}
          </span>
        </Text>
        <Button type="button" outline onClick={() => void signOut()} className="w-fit">
          Sign out
        </Button>
      </div>
    </div>
  );
}
