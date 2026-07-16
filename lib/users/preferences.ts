import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from "@/lib/types/user";

export function normalizePreferences(
  raw: Partial<UserPreferences> | null | undefined,
): UserPreferences {
  return {
    homeView:
      raw?.homeView === "tasks" || raw?.homeView === "progress"
        ? raw.homeView
        : DEFAULT_USER_PREFERENCES.homeView,
    reflectionPromptEnabled:
      typeof raw?.reflectionPromptEnabled === "boolean"
        ? raw.reflectionPromptEnabled
        : DEFAULT_USER_PREFERENCES.reflectionPromptEnabled,
    nudgeGoalQuality:
      typeof raw?.nudgeGoalQuality === "boolean"
        ? raw.nudgeGoalQuality
        : DEFAULT_USER_PREFERENCES.nudgeGoalQuality,
    stallDaysThreshold:
      typeof raw?.stallDaysThreshold === "number" &&
      raw.stallDaysThreshold > 0
        ? Math.min(30, Math.floor(raw.stallDaysThreshold))
        : DEFAULT_USER_PREFERENCES.stallDaysThreshold,
    reminderCadence:
      raw?.reminderCadence === "daily" ||
      raw?.reminderCadence === "weekly" ||
      raw?.reminderCadence === "off"
        ? raw.reminderCadence
        : DEFAULT_USER_PREFERENCES.reminderCadence,
  };
}
