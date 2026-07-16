import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { normalizePreferences } from "@/lib/users/preferences";
import type { UserPreferences } from "@/lib/types/user";

export type CohortUser = {
  uid: string;
  email: string;
  displayName: string;
};

export async function listCohortUsers(): Promise<CohortUser[]> {
  const q = query(
    collection(getFirestoreDb(), "users"),
    orderBy("displayName", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      email: String(data.email ?? ""),
      displayName: String(data.displayName ?? data.email ?? d.id),
    };
  });
}

export function formatUserLabel(user: CohortUser): string {
  if (user.displayName && user.email) {
    return `${user.displayName} (${user.email})`;
  }
  return user.displayName || user.email || user.uid;
}

export async function saveUserPreferences(
  uid: string,
  preferences: UserPreferences,
): Promise<UserPreferences> {
  const next = normalizePreferences(preferences);
  await updateDoc(doc(getFirestoreDb(), "users", uid), {
    preferences: next,
  });
  return next;
}
