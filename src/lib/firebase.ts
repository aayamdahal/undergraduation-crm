import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseConfigKeys =
  | "NEXT_PUBLIC_FIREBASE_API_KEY"
  | "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  | "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  | "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
  | "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  | "NEXT_PUBLIC_FIREBASE_APP_ID";

const getFirebaseConfig = () => {
  const missingKeys: FirebaseConfigKeys[] = [];

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) missingKeys.push("NEXT_PUBLIC_FIREBASE_API_KEY");

  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (!authDomain) missingKeys.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) missingKeys.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!storageBucket) missingKeys.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");

  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  if (!messagingSenderId)
    missingKeys.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");

  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!appId) missingKeys.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase configuration values: ${missingKeys.join(", ")}`
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

let cachedApp: FirebaseApp | null = null;

const getFirebaseApp = (): FirebaseApp => {
  if (cachedApp) {
    return cachedApp;
  }

  if (getApps().length > 0) {
    cachedApp = getApp();
    return cachedApp;
  }

  const firebaseConfig = getFirebaseConfig();
  cachedApp = initializeApp(firebaseConfig);
  return cachedApp;
};

const initializeFirestore = (): Firestore => {
  const app = getFirebaseApp();
  return getFirestore(app);
};

const initializeAuth = (): Auth => {
  const app = getFirebaseApp();
  return getAuth(app);
};

let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;
let initializationError: Error | null = null;

try {
  cachedDb = initializeFirestore();
} catch (error) {
  initializationError =
    error instanceof Error ? error : new Error(String(error ?? ""));

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[firebase] ${initializationError.message}. Falling back to mock data store.`
    );
  }
}

export const getDb = (): Firestore => {
  if (!cachedDb) {
    throw (initializationError ??
      new Error("Firebase has not been initialised."));
  }
  return cachedDb;
};

export const getAuthClient = (): Auth => {
  if (!cachedDb) {
    throw (initializationError ??
      new Error("Firebase has not been initialised."));
  }

  if (!cachedAuth) {
    cachedAuth = initializeAuth();
  }

  return cachedAuth;
};

export const isFirebaseConfigured = (): boolean => cachedDb !== null;

export const getFirebaseInitializationError = (): Error | null =>
  initializationError;
