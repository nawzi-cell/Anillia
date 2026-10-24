import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-espresso text-ivory shadow-[0_14px_30px_-18px_rgba(42,37,33,0.7)] hover:-translate-y-0.5 hover:bg-espresso-light hover:shadow-[0_18px_34px_-18px_rgba(42,37,33,0.65)] active:translate-y-0 disabled:bg-espresso/40 disabled:shadow-none",
  secondary:
    "border border-espresso/25 bg-transparent text-espresso hover:-translate-y-0.5 hover:border-espresso hover:bg-espresso/5 active:translate-y-0 disabled:opacity-50",
  ghost: "text-espresso hover:bg-espresso/5 disabled:opacity-50",
  danger: "bg-red-900/90 text-ivory hover:bg-red-900 disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className = "",
      type = "button",
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-sans text-[12.5px] font-semibold uppercase tracking-widest2 transition-all duration-300 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    />
  )
);
Button.displayName = "Button";
