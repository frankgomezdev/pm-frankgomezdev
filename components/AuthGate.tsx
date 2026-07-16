"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/catalyst/auth-layout";
import { Button } from "@/components/catalyst/button";
import { Heading } from "@/components/catalyst/heading";
import { Code, Text } from "@/components/catalyst/text";
import { useAuth } from "@/components/providers/AuthProvider";
import { ErrorBanner } from "@/components/ui/Banner";

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
      <AuthLayout>
        <Text>Checking session…</Text>
      </AuthLayout>
    );
  }

  if (!user) {
    return (
      <AuthLayout>
        <Text>Redirecting to sign in…</Text>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout>
        <div className="grid w-full max-w-sm grid-cols-1 gap-6">
          <Heading>Profile error</Heading>
          <ErrorBanner>{error}</ErrorBanner>
          <Text>
            If this mentions permissions, create a Firestore database and deploy
            the rules in <Code>firestore.rules</Code>, or temporarily use test
            mode while developing.
          </Text>
          <Button outline onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return <>{children}</>;
}
