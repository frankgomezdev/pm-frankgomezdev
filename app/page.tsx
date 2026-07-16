"use client";

import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getFirebaseApp } from "@/lib/firebase/client";

type Status = "checking" | "ready" | "missing-env" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setStatus("missing-env");
      setDetail("Copy .env.example → .env.local and fill Firebase web config values.");
      return;
    }

    try {
      const app = getFirebaseApp();
      setStatus("ready");
      setDetail(`Firebase app initialized (project: ${app.options.projectId}).`);
    } catch (err) {
      setStatus("error");
      setDetail(err instanceof Error ? err.message : "Failed to initialize Firebase.");
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-zinc-500">Slice A1</p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Cohort PM scaffold
      </h1>
      <p className="text-zinc-600">
        Next.js + TypeScript + Firebase client wiring. Auth UI and shell nav land in A2.
      </p>
      <p
        className={
          status === "ready"
            ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
            : status === "missing-env"
              ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              : status === "error"
                ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
                : "rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
        }
      >
        {status === "checking" ? "Checking Firebase config…" : detail}
      </p>
    </main>
  );
}
