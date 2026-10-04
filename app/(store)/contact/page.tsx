"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

const CONTACT_INFO = [
  { icon: Mail, label: "Email", value: "hello@anilliea.pk" },
  { icon: Phone, label: "Phone", value: "+92 21 3456 7890" },
  { icon: MapPin, label: "Studio", value: "Karachi, Pakistan" },
  { icon: Clock, label: "Hours", value: "Mon–Sat, 9am–6pm PKT" },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (name.trim().length < 2) {
      setResult({ tone: "error", text: "Please enter your name." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setResult({ tone: "error", text: "Please enter a valid email address." });
      return;
    }
    if (message.trim().length < 10) {
      setResult({ tone: "error", text: "Please tell us a little more — at least 10 characters." });
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/contact", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || undefined,
          message: message.trim(),
        },
      });
      setResult({ tone: "success", text: "Thank you — your message has been sent. We reply within one working day." });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setResult({ tone: "error", text: err instanceof Error ? err.message : "Could not send your message. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x pb-16 md:pb-20">
      <Breadcrumbs trail={[{ label: "Contact" }]} />
      <div className="mb-10 mt-2 max-w-2xl">
        <p className="eyebrow mb-3">Get in touch</p>
        <h1 className="font-serif text-4xl text-espresso md:text-5xl">Contact Us</h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-espresso-muted md:text-base">
          Questions about an order, a fabric, or sizing? We would love to hear
          from you — write below or reach us directly.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <Card>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayesha Khan" autoComplete="name" required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
            <div className="sm:col-span-2">
              <Input label="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Order enquiry, fabric question…" maxLength={120} />
            </div>
            <div className="sm:col-span-2">
              <Textarea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" rows={6} required maxLength={2000} />
            </div>
            {result && (
              <div className="sm:col-span-2">
                <Alert tone={result.tone}>{result.text}</Alert>
              </div>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send message"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          {CONTACT_INFO.map((info) => (
            <Card key={info.label} className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-espresso/5">
                <info.icon className="h-5 w-5 text-espresso" aria-hidden />
              </span>
              <span>
                <span className="block font-sans text-xs uppercase tracking-widest2 text-espresso-muted">
                  {info.label}
                </span>
                <span className="font-sans text-sm font-medium text-espresso">{info.value}</span>
              </span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
