"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function NewsletterForm({
  dark = false,
  className = "",
}: {
  dark?: boolean;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      await apiFetch("/api/newsletter", { method: "POST", body: { email: trimmed } });
      setStatus("done");
      setMessage("Thank you — you are on the list.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (status === "done") {
    return <Alert tone="success" className={className}>{message}</Alert>;
  }

  return (
    <form onSubmit={submit} className={className} noValidate>
      <div className="flex gap-2">
        <div className={dark ? "[&_input]:border-ivory/20 [&_input]:bg-ivory/10 [&_input]:text-ivory [&_input]:placeholder:text-ivory/40" : ""}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            aria-label="Email address"
            disabled={status === "loading"}
          />
        </div>
        <Button
          type="submit"
          size="md"
          variant={dark ? "secondary" : "primary"}
          disabled={status === "loading"}
          className={dark ? "!border-ivory/30 !text-ivory hover:!border-ivory" : ""}
        >
          {status === "loading" ? "Joining…" : "Join"}
        </Button>
      </div>
      {status === "error" && (
        <p className={`mt-2 font-sans text-xs ${dark ? "text-red-300" : "text-red-800"}`} role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
