"use client";

import { type FormEvent, useEffect, useState } from "react";

import type { RegistrationDetails } from "@/hooks/useAuth";

type LoginPanelProps = {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister?: (details: RegistrationDetails) => Promise<boolean>;
  onDismissError: () => void;
  error: string | null;
  isSubmitting: boolean;
  isRestoring: boolean;
};

export const LoginPanel = ({
  onLogin,
  onRegister,
  onDismissError,
  error,
  isSubmitting,
  isRestoring,
}: LoginPanelProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const supportsRegistration = typeof onRegister === "function";
  const isLoginMode = mode === "login";
  const isBusy = isSubmitting || isRestoring;

  useEffect(() => {
    if (!supportsRegistration) {
      setMode("login");
      setName("");
    }
  }, [supportsRegistration]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return;
    }

    if (!isLoginMode && supportsRegistration && onRegister) {
      const didRegister = await onRegister({
        email: trimmedEmail,
        password: trimmedPassword,
        name: trimmedName || undefined,
      });
      if (didRegister) {
        setPassword("");
        setName("");
      }
      return;
    }

    const didLogin = await onLogin(trimmedEmail, trimmedPassword);
    if (didLogin) {
      setPassword("");
    }
  };

  const handleModeToggle = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setPassword("");
    if (nextMode === "login") {
      setName("");
    }
    onDismissError();
  };

  return (
    <div className="min-h-screen bg-slate-100 transition-colors">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center">
        <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/60 transition-colors">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
            Undergraduation.com
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            {isLoginMode
              ? "Sign in to the advisor console"
              : "Create your advisor account"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            {supportsRegistration && onRegister
              ? "Sign in with your advisor credentials or create a new login."
              : "Sign in with your advisor credentials."}
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              {!isLoginMode && (
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Full name
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    disabled={isBusy}
                    onChange={(event) => {
                      if (error) onDismissError();
                      setName(event.target.value);
                    }}
                    placeholder="Alex Johnson"
                    className="mt-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </label>
              )}
              <label className="flex flex-col text-xs font-semibold text-slate-600">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={isBusy}
                  onChange={(event) => {
                    if (error) onDismissError();
                    setEmail(event.target.value);
                  }}
                  placeholder="advisor@example.com"
                  className="mt-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-xs font-semibold text-slate-600">
                Password
                <input
                  type="password"
                  autoComplete={isLoginMode ? "current-password" : "new-password"}
                  value={password}
                  disabled={isBusy}
                  onChange={(event) => {
                    if (error) onDismissError();
                    setPassword(event.target.value);
                  }}
                  placeholder="••••••"
                  className="mt-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-inner focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </label>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-sm transition-colors">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRestoring
                ? "Checking existing session..."
                : isSubmitting
                ? isLoginMode
                  ? "Signing you in..."
                  : "Creating your account..."
                : isLoginMode
                ? "Sign in"
                : "Create account"}
            </button>

            {supportsRegistration && (
              <p className="text-center text-xs text-slate-500">
                {isLoginMode ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      className="font-semibold text-indigo-600 transition hover:underline"
                      onClick={() => handleModeToggle("signup")}
                      disabled={isBusy}
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="font-semibold text-indigo-600 transition hover:underline"
                      onClick={() => handleModeToggle("login")}
                      disabled={isBusy}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};
