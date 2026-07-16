"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV = [
  { href: "/", label: "Progress" },
  { href: "/tasks", label: "Tasks" },
  { href: "/projects", label: "Projects" },
  { href: "/stalls", label: "Stalls" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold tracking-tight">
              Cohort PM
            </span>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "rounded-md bg-zinc-900 px-2.5 py-1.5 text-white"
                        : "rounded-md px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">
              {profile?.displayName ?? "Signed in"}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-zinc-700 hover:bg-zinc-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
