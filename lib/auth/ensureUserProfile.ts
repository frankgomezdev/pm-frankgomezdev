import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirestoreDb } from "@/lib/firebase/client";
import {
  DEFAULT_USER_PREFERENCES,
  type UserProfile,
} from "@/lib/types/user";
import { normalizePreferences } from "@/lib/users/preferences";

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(getFirestoreDb(), "users", user.uid);
  const snap = await getDoc(ref);

  const email = user.email ?? "";
  const displayName =
    user.displayName?.trim() ||
    email.split("@")[0] ||
    "Cohort member";

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    const preferences = normalizePreferences(
      existing.preferences ?? DEFAULT_USER_PREFERENCES,
    );
    // Signup can create the doc before updateProfile finishes; sync name when Auth has it.
    if (
      user.displayName?.trim() &&
      existing.displayName !== user.displayName.trim()
    ) {
      await setDoc(
        ref,
        { displayName: user.displayName.trim(), preferences },
        { merge: true },
      );
      return {
        ...existing,
        displayName: user.displayName.trim(),
        preferences,
      };
    }
    return { ...existing, preferences };
  }

  const profile: UserProfile = {
    email,
    displayName,
    createdAt: serverTimestamp(),
    preferences: { ...DEFAULT_USER_PREFERENCES },
  };

  await setDoc(ref, profile);
  return profile;
}
