/**
 * Firebase web config from public env vars.
 * Web API keys are expected to be public; never put Admin/service-account secrets here.
 *
 * Important: Next.js only inlines NEXT_PUBLIC_* when accessed as static property reads
 * (process.env.NEXT_PUBLIC_FOO). Dynamic process.env[key] is always undefined in the client bundle.
 */

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function readFirebaseEnv() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? "",
  };
}

export function getMissingFirebaseEnvKeys(): string[] {
  const env = readFirebaseEnv();
  const checks: Array<[string, string]> = [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", env.apiKey],
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", env.authDomain],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", env.projectId],
    ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", env.storageBucket],
    ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", env.messagingSenderId],
    ["NEXT_PUBLIC_FIREBASE_APP_ID", env.appId],
  ];
  return checks.filter(([, value]) => !value).map(([key]) => key);
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

  return readFirebaseEnv();
}
