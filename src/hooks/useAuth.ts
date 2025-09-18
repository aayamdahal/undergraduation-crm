"use client";

import { useCallback, useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { getAuthClient } from "@/lib/firebase";

export type AuthenticatedUser = {
  email: string;
  name: string;
  role: string;
  initials: string;
};

export type RegistrationDetails = {
  email: string;
  password: string;
  name?: string;
};

export type UseAuthReturn = {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  isSubmitting: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: ((details: RegistrationDetails) => Promise<boolean>) | null;
  logout: () => Promise<void> | void;
  clearError: () => void;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const deriveNameFromFirebaseUser = (firebaseUser: User): string => {
  const fromProfile = firebaseUser.displayName?.trim();
  if (fromProfile) return fromProfile;

  const email = firebaseUser.email?.trim();
  if (!email) return "Advisor";

  const localPart = email.split("@")[0] ?? "";
  const cleaned = localPart.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return email;

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase().concat(segment.slice(1)) ?? "")
    .join(" ");
};

const mapFirebaseUserToAuthenticated = (
  firebaseUser: User
): AuthenticatedUser => {
  const email = firebaseUser.email ?? "";
  const name = deriveNameFromFirebaseUser(firebaseUser);

  return {
    email,
    name,
    role: "Admissions Advisor",
    initials: getInitials(name || email || "Advisor"),
  } satisfies AuthenticatedUser;
};

const formatFirebaseAuthError = (
  error: unknown,
  fallback: string
): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password. Try again.";
      case "auth/too-many-requests":
        return "Too many unsuccessful attempts. Please wait and try again.";
      case "auth/email-already-in-use":
        return "An account already exists for that email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      default:
        break;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const AUTH_INITIALISATION_ERROR_MESSAGE =
  "Authentication is not configured. Please contact your administrator.";

const useFirebaseAuthState = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    let authClient: ReturnType<typeof getAuthClient> | null = null;
    try {
      authClient = getAuthClient();
    } catch (initialisationError) {
      if (!isActive) {
        return;
      }

      const message =
        process.env.NODE_ENV === "production"
          ? AUTH_INITIALISATION_ERROR_MESSAGE
          : formatFirebaseAuthError(
              initialisationError,
              AUTH_INITIALISATION_ERROR_MESSAGE
            );

      setError(message);
      setUser(null);
      setIsRestoring(false);
      return;
    }

    void setPersistence(authClient, browserSessionPersistence).catch(
      (persistenceError) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[auth] Failed to set session persistence",
            persistenceError
          );
        }
      }
    );

    const unsubscribe = onAuthStateChanged(
      authClient,
      (firebaseUser) => {
        if (!isActive) return;

        if (firebaseUser) {
          setUser(mapFirebaseUserToAuthenticated(firebaseUser));
        } else {
          setUser(null);
        }

        setIsRestoring(false);
      },
      (restoreError) => {
        if (!isActive) return;

        if (process.env.NODE_ENV !== "production") {
          console.error("[auth] Failed to restore session", restoreError);
        }
        setError(
          "We couldn't restore your session. Please sign in again."
        );
        setUser(null);
        setIsRestoring(false);
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const auth = getAuthClient();
      const credentials = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password.trim()
      );

      setUser(mapFirebaseUserToAuthenticated(credentials.user));
      return true;
    } catch (signInError) {
      const message = formatFirebaseAuthError(
        signInError,
        "We couldn't sign you in. Check your credentials and try again."
      );
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const register = useCallback(
    async ({ email, password, name }: RegistrationDetails) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const auth = getAuthClient();
        const credentials = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password.trim()
        );

        if (name && name.trim()) {
          await updateProfile(credentials.user, { displayName: name.trim() });
        }

        setUser(mapFirebaseUserToAuthenticated(credentials.user));
        return true;
      } catch (signUpError) {
        const message = formatFirebaseAuthError(
          signUpError,
          "Unable to create your account. Please try again."
        );
        setError(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      const auth = getAuthClient();
      await signOut(auth);
      setUser(null);
    } catch (signOutError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[auth] Failed to sign out", signOutError);
      }
      setError("We couldn't sign you out. Please try again.");
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    isRestoring,
    isSubmitting,
    error,
    login,
    register,
    logout,
    clearError,
  };
};

export const useAuth: () => UseAuthReturn = useFirebaseAuthState;
