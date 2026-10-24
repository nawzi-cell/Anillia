"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { AuthShell } from "./auth-shell";

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense fallback={<AuthFallback />}>
        <LoginForm />
      </Suspense>
    </AuthProvider>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next") || "/";
  // Only same-origin absolute paths are allowed: `//evil.example` and
  // `/\evil.example` are protocol-relative/browser-normalized external URLs.
  const next =
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//") &&
    !requestedNext.startsWith("/\\")
      ? requestedNext
      : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setBusy(true);
    try {
      const sessionUser = await login(email.trim(), password);
      if (!sessionUser) {
        setError("Could not sign you in. Please try again.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your ANILLIÉA account.">
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" fullWidth disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="mt-6 flex items-center justify-between font-sans text-sm">
        <Link href="/forgot-password" className="text-espresso-muted underline underline-offset-4 hover:text-espresso">
          Forgot password?
        </Link>
        <Link href="/register" className="font-semibold text-espresso underline underline-offset-4 hover:text-taupe-dark">
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}

function AuthFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory">
      <Spinner size="lg" />
    </div>
  );
}
