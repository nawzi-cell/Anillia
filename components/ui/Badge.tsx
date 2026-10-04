import type { ReactNode } from "react";

type Tone = "default" | "sale" | "success" | "muted" | "olive";

const tones: Record<Tone, string> = {
  default: "bg-espresso text-ivory",
  sale: "bg-espresso text-ivory",
  success: "bg-olive text-ivory",
  muted: "bg-espresso/10 text-espresso",
  olive: "bg-olive-light/20 text-olive-dark",
};

export function Badge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-widest2 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
