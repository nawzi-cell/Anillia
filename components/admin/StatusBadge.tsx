interface StatusBadgeProps {
  status: string | null | undefined;
  tone?: "order" | "payment" | "review" | "bool";
}

const orderTones: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-200",
  CONFIRMED: "bg-sky-100 text-sky-900 border-sky-200",
  PROCESSING: "bg-indigo-100 text-indigo-900 border-indigo-200",
  SHIPPED: "bg-violet-100 text-violet-900 border-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-900 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-900 border-red-200",
  RETURN_REQUESTED: "bg-orange-100 text-orange-900 border-orange-200",
  RETURNED: "bg-stone-200 text-stone-700 border-stone-300",
};

const paymentTones: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-900 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-900 border-amber-200",
  FAILED: "bg-red-100 text-red-900 border-red-200",
  REFUNDED: "bg-stone-200 text-stone-700 border-stone-300",
  COD: "bg-sky-100 text-sky-900 border-sky-200",
  UNPAID: "bg-amber-100 text-amber-900 border-amber-200",
};

const reviewTones: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-900 border-emerald-200",
  HIDDEN: "bg-stone-200 text-stone-700 border-stone-300",
  REJECTED: "bg-red-100 text-red-900 border-red-200",
};

function pretty(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function StatusBadge({ status, tone = "order" }: StatusBadgeProps) {
  if (status == null || status === "") return <span className="text-espresso-muted">—</span>;

  if (tone === "bool") {
    const on = ["true", "1", "active", "yes"].includes(String(status).toLowerCase());
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
          on
            ? "border-emerald-200 bg-emerald-100 text-emerald-900"
            : "border-stone-300 bg-stone-200 text-stone-600"
        }`}
      >
        {on ? "Active" : "Inactive"}
      </span>
    );
  }

  const map =
    tone === "payment" ? paymentTones : tone === "review" ? reviewTones : orderTones;
  const cls =
    map[status.toUpperCase()] ??
    "border-espresso/20 bg-espresso/5 text-espresso-muted";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {pretty(status)}
    </span>
  );
}
