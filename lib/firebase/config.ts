/**
 * Firebase web config from public env vars.
 * Web API keys are expected to be public; never put Admin/service-account secrets here.
 */

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export function getMissingFirebaseEnvKeys(): string[] {
  return REQUIRED_KEYS.filter((key) => !process.env[key]?.trim());
}

export function isFirebaseConfigured(): boolean {
  return getMissingFirebaseEnvKeys().length === 0;
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
  const missing = getMissingFirebaseEnvKeys();
  if (missing.length > 0) {
    throw new Error(
      `Firebase is not configured. Missing env: ${missing.join(", ")}. Copy .env.example to .env.local.`,
    );
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}
