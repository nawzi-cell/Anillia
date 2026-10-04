"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch, toDisplayReview, type DisplayReview, type Review } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { StarRating } from "@/components/ui/StarRating";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

export function ReviewSection({
  productId,
  initialReviews,
  summary,
}: {
  productId: string;
  initialReviews: DisplayReview[];
  summary: { count: number; average: number | null };
}) {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<DisplayReview[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (comment.trim().length < 10) {
      setError("Please write a little more — at least 10 characters helps other shoppers.");
      return;
    }
    setBusy(true);
    try {
      const created = await apiFetch<Review>("/api/reviews", {
        method: "POST",
        body: {
          productId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        },
      });
      // The POST response is the raw review (no author); attribute it to the
      // signed-in user for immediate display.
      setReviews((prev) => [
        toDisplayReview({ ...created, user: { name: user?.name ?? "You" } }),
        ...prev,
      ]);
      setTitle("");
      setComment("");
      setRating(5);
      setSuccess("Thank you — your review has been submitted.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit your review. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Reviews" className="container-x pb-16 md:pb-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* List */}
        <div>
          <div className="mb-6 flex items-center gap-4">
            <h2 className="font-serif text-3xl text-espresso">Reviews</h2>
            {summary.count > 0 && (
              <span className="flex items-center gap-2">
                <StarRating value={summary.average ?? 0} size="sm" />
                <span className="font-sans text-sm text-espresso-muted">
                  {(summary.average ?? 0).toFixed(1)} · {summary.count} review{summary.count === 1 ? "" : "s"}
                </span>
              </span>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="font-sans text-sm text-espresso-muted">
              No reviews yet — be the first to share your thoughts.
            </p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <StarRating value={r.rating} size="sm" />
                      <time className="font-sans text-xs text-espresso-muted">
                        {new Date(r.createdAt).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    {r.title && (
                      <h3 className="mt-2 font-serif text-lg text-espresso">{r.title}</h3>
                    )}
                    <p className="mt-1.5 font-sans text-sm leading-relaxed text-espresso-muted">
                      {r.comment}
                    </p>
                    <p className="mt-3 font-sans text-xs font-semibold uppercase tracking-widest2 text-taupe-dark">
                      {r.authorName}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Form */}
        <div>
          <Card>
            <h3 className="font-serif text-xl text-espresso">Write a review</h3>
            {authLoading ? (
              <p className="mt-4 font-sans text-sm text-espresso-muted">Loading…</p>
            ) : !user ? (
              <div className="mt-4">
                <p className="font-sans text-sm text-espresso-muted">
                  Please sign in to share your review.
                </p>
                <Link href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`} className="mt-4 block">
                  <Button variant="secondary" fullWidth size="sm">
                    Sign in
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-4">
                <div>
                  <span className="mb-1.5 block font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso-muted">
                    Your rating
                  </span>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <Input
                  label="Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sum it up"
                  maxLength={80}
                />
                <Textarea
                  label="Your review"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the fabric, the fit, the drape?"
                  rows={4}
                  maxLength={1000}
                />
                {error && <Alert tone="error">{error}</Alert>}
                {success && <Alert tone="success">{success}</Alert>}
                <Button type="submit" fullWidth disabled={busy}>
                  {busy ? "Submitting…" : "Submit review"}
                </Button>
                <p className="font-sans text-xs text-espresso-muted">
                  Only verified purchases can leave a review.
                </p>
              </form>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
