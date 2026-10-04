import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type Tone = "error" | "success" | "info";

const tones: Record<Tone, { wrap: string; icon: typeof Info }> = {
  error: { wrap: "border-red-800/30 bg-red-900/5 text-red-900", icon: AlertCircle },
  success: { wrap: "border-olive/40 bg-olive/10 text-olive-dark", icon: CheckCircle2 },
  info: { wrap: "border-espresso/20 bg-espresso/5 text-espresso", icon: Info },
};

export function Alert({
  tone = "info",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const { wrap, icon: Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 font-sans text-sm ${wrap} ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
