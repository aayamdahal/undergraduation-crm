"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoginPanel } from "@/components/auth/LoginPanel";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const {
    isAuthenticated,
    isRestoring,
    isSubmitting,
    error: authError,
    login,
    register,
    clearError,
  } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 transition-colors">
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-600 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"
              aria-hidden
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"
              aria-hidden
            />
          </span>
          Redirecting to your dashboard…
        </div>
      </div>
    );
  }

  return (
    <LoginPanel
      onLogin={login}
      onRegister={register ?? undefined}
      onDismissError={clearError}
      error={authError}
      isSubmitting={isSubmitting}
      isRestoring={isRestoring}
    />
  );
}
