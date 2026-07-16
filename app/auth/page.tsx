"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

type Mode = "login" | "signup";

function authErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong. Try again.";
  const code = "code" in err ? String((err as { code?: string }).code) : "";
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Sign in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    default:
      return err.message;
  }
}

export default function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, displayName);
      }
      router.replace("/");
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        {user ? "Redirecting…" : "Loading…"}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Cohort PM
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          {mode === "signup" ? "Create an account" : "Sign in"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Email and password via Firebase Auth.
        </p>

        <div className="mt-4 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setFormError(null);
            }}
            className={
              mode === "signup"
                ? "rounded-md bg-zinc-900 px-3 py-1.5 text-white"
                : "rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100"
            }
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setFormError(null);
            }}
            className={
              mode === "login"
                ? "rounded-md bg-zinc-900 px-3 py-1.5 text-white"
                : "rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100"
            }
          >
            Sign in
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
          {mode === "signup" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-700">Display name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
                placeholder="How teammates will see you"
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-700">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
            />
          </label>

          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting
              ? "Working…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
