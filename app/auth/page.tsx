"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/catalyst/auth-layout";
import { Button } from "@/components/catalyst/button";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Strong, Text } from "@/components/catalyst/text";
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

  function switchMode(next: Mode) {
    setMode(next);
    setFormError(null);
  }

  if (loading || user) {
    return (
      <AuthLayout>
        <Text>{user ? "Redirecting…" : "Loading…"}</Text>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form
        onSubmit={onSubmit}
        className="grid w-full max-w-sm grid-cols-1 gap-8"
      >
        <div>
          <Text className="uppercase tracking-wide">Cohort PM</Text>
          <Heading className="mt-1">
            {mode === "signup" ? "Create an account" : "Sign in"}
          </Heading>
          <Text className="mt-2">Email and password via Firebase Auth.</Text>
        </div>

        {mode === "signup" ? (
          <Field>
            <Label>Display name</Label>
            <Input
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              placeholder="How teammates will see you"
            />
          </Field>
        ) : null}

        <Field>
          <Label>Email</Label>
          <Input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>

        <Field>
          <Label>Password</Label>
          <Input
            type="password"
            name="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
          />
        </Field>

        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm/6 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {formError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting
            ? "Working…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </Button>

        {mode === "signup" ? (
          <Text>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="inline font-medium text-zinc-950 underline decoration-zinc-950/50 hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:hover:decoration-white"
            >
              <Strong>Sign in</Strong>
            </button>
          </Text>
        ) : (
          <Text>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="inline font-medium text-zinc-950 underline decoration-zinc-950/50 hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:hover:decoration-white"
            >
              <Strong>Sign up</Strong>
            </button>
          </Text>
        )}
      </form>
    </AuthLayout>
  );
}
