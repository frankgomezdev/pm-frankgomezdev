"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  reload,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/auth/ensureUserProfile";
import { saveUserPreferences } from "@/lib/users/api";
import {
  normalizePreferences,
} from "@/lib/users/preferences";
import type { UserPreferences, UserProfile } from "@/lib/types/user";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setError(null);
      try {
        if (!nextUser) {
          setUser(null);
          setProfile(null);
          return;
        }
        const nextProfile = await ensureUserProfile(nextUser);
        setUser(nextUser);
        setProfile(nextProfile);
      } catch (err) {
        setUser(nextUser);
        setProfile(null);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load or create user profile.",
        );
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      setError(null);
      const cred = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password,
      );
      const name = displayName.trim();
      if (name) {
        await updateProfile(cred.user, { displayName: name });
        await reload(cred.user);
        // onAuthStateChanged may have already created the profile with the
        // email prefix before updateProfile finished — write the real name.
        await setDoc(
          doc(getFirestoreDb(), "users", cred.user.uid),
          { displayName: name },
          { merge: true },
        );
      }
      const nextProfile = await ensureUserProfile(cred.user);
      setUser(cred.user);
      setProfile(nextProfile);
    },
    [],
  );

  const signOut = useCallback(async () => {
    setError(null);
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const updatePreferences = useCallback(
    async (prefs: UserPreferences) => {
      if (!user) throw new Error("Not signed in.");
      const next = await saveUserPreferences(user.uid, prefs);
      setProfile((prev) =>
        prev
          ? { ...prev, preferences: normalizePreferences(next) }
          : prev,
      );
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      clearError,
      signIn,
      signUp,
      signOut,
      updatePreferences,
    }),
    [
      user,
      profile,
      loading,
      error,
      clearError,
      signIn,
      signUp,
      signOut,
      updatePreferences,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
