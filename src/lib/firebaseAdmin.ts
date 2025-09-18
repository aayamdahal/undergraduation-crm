import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type FirebaseAdminConfigKeys =
  | "FIREBASE_PROJECT_ID"
  | "FIREBASE_CLIENT_EMAIL"
  | "FIREBASE_PRIVATE_KEY";

let cachedDb: FirebaseFirestore.Firestore | null = null;
let initializationError: Error | null = null;
let didAttemptInitialization = false;

const normalizePrivateKey = (value: string) => value.replace(/\\n/g, "\n");

const initializeFirestore = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const missingKeys: FirebaseAdminConfigKeys[] = [];

  if (!projectId) missingKeys.push("FIREBASE_PROJECT_ID");
  if (!clientEmail) missingKeys.push("FIREBASE_CLIENT_EMAIL");
  if (!privateKey) missingKeys.push("FIREBASE_PRIVATE_KEY");

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase Admin configuration values: ${missingKeys.join(", ")}`
    );
  }

  const normalizedPrivateKey = normalizePrivateKey(privateKey!);

  const apps = getApps();
  const app =
    apps.length > 0
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: normalizedPrivateKey,
          }),
        });

  return getFirestore(app);
};

const ensureInitialized = () => {
  if (cachedDb || initializationError || didAttemptInitialization) {
    return;
  }

  didAttemptInitialization = true;

  try {
    cachedDb = initializeFirestore();
  } catch (error) {
    initializationError =
      error instanceof Error ? error : new Error(String(error ?? ""));
    cachedDb = null;

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[firebase-admin] ${initializationError.message}. Using mock data store.`
      );
    }
  }
};

export const getAdminDb = (): FirebaseFirestore.Firestore => {
  ensureInitialized();
  if (!cachedDb) {
    throw (
      initializationError ?? new Error("Firebase Admin has not been initialised.")
    );
  }
  return cachedDb;
};

export const isFirebaseAdminConfigured = (): boolean => {
  ensureInitialized();
  return cachedDb !== null;
};

export const getFirebaseAdminInitializationError = (): Error | null => {
  ensureInitialized();
  return initializationError;
};
