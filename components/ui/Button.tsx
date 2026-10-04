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
    "bg-espresso text-ivory hover:bg-espresso-light disabled:bg-espresso/40",
  secondary:
    "border border-espresso/25 bg-transparent text-espresso hover:border-espresso hover:bg-espresso/5 disabled:opacity-50",
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
      className={`inline-flex items-center justify-center gap-2 rounded-full font-sans text-[13px] font-semibold uppercase tracking-widest2 transition-colors duration-200 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...rest}
    />
  )
);
Button.displayName = "Button";
