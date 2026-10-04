"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { AuthShell } from "../login/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ivory">
          <Spinner size="lg" />
        </div>
      }
    >
      <ForgotPasswordFlow />
    </Suspense>
  );
}

function ForgotPasswordFlow() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  return token ? <ResetForm token={token} /> : <RequestForm />;
}

function RequestForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
    >
      {done ? (
        <Alert tone="success">
          If an account exists for that email, a reset link is on its way. Please
          check your inbox (and spam folder).
        </Alert>
      ) : (
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
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center font-sans text-sm text-espresso-muted">
        <Link href="/login" className="font-semibold text-espresso underline underline-offset-4 hover:text-taupe-dark">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: { token, password },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This link may have expired. Please request a new one.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Enter a new password for your account.">
      {done ? (
        <div>
          <Alert tone="success">Your password has been reset.</Alert>
          <Link href="/login" className="mt-4 block">
            <Button fullWidth>Sign in</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
            autoComplete="new-password"
            required
          />
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
