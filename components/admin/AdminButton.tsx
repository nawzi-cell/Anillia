import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-espresso text-ivory hover:bg-espresso-light disabled:bg-espresso/40",
  secondary:
    "bg-ivory-dark/60 text-espresso border border-espresso/15 hover:border-espresso/30 disabled:opacity-50",
  danger: "bg-red-800 text-ivory hover:bg-red-700 disabled:bg-red-800/40",
  ghost: "text-espresso-muted hover:text-espresso hover:bg-espresso/5",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function AdminButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  children,
  disabled,
  ...rest
}: AdminButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-sans font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}
