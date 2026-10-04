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
  const next = searchParams.get("next") || "/";

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
        // TEMP-DIAG (2026-10-03): credentials were accepted but the session
        // check failed — ask the server WHY and show it instead of the
        // mystery bounce. Remove once the sign-in issue is resolved.
        let diag = "NO_COOKIE";
        try {
          const r = await fetch("/api/auth/me", { credentials: "include" });
          const j = (await r.json().catch(() => null)) as { diag?: string } | null;
          if (j && typeof j.diag === "string") diag = j.diag;
        } catch {
          /* keep default */
        }
        if (diag === "NO_USER") {
          setError(
            "Signed in, but your account wasn't found in the database. Please run 'npx prisma db seed' and try again."
          );
        } else if (diag === "BAD_TOKEN" || diag === "ERROR") {
          setError(
            `Signed in, but the server rejected the session (code ${diag}). Please tell Remy you saw this exact message.`
          );
        } else {
          setError(
            "Signed in, but your browser didn't keep the login session (code NO_COOKIE). This usually means cookies are blocked for this site. Please allow cookies for this site and try again."
          );
        }
        return;
      }
      router.push(next.startsWith("/") ? next : "/");
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
