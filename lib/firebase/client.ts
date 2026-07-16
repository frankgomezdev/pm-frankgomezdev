import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseClientConfig } from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseClientConfig());
  return app;
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  auth = getAuth(getFirebaseApp());
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (db) return db;
  db = getFirestore(getFirebaseApp());
  return db;
}
