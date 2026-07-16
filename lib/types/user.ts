export type UserPreferences = {
  homeView: "progress" | "tasks";
  reflectionPromptEnabled: boolean;
  nudgeGoalQuality: boolean;
  stallDaysThreshold: number;
  reminderCadence: "off" | "daily" | "weekly";
};

export type UserProfile = {
  email: string;
  displayName: string;
  createdAt: unknown;
  preferences: UserPreferences;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  homeView: "progress",
  reflectionPromptEnabled: true,
  nudgeGoalQuality: true,
  stallDaysThreshold: 3,
  reminderCadence: "off",
};
