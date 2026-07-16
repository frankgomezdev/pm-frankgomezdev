"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, error, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Redirecting to sign in…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-3 px-6">
        <h1 className="text-xl font-semibold text-zinc-900">Profile error</h1>
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
        <p className="text-sm text-zinc-600">
          If this mentions permissions, create a Firestore database and deploy
          the rules in <code className="font-mono text-xs">firestore.rules</code>
          , or temporarily use test mode while developing.
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="w-fit rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
