import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className = "", ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? rest.name ?? generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={`w-full appearance-none rounded-lg border bg-white/60 py-3 pl-4 pr-10 font-sans text-sm text-espresso transition-colors focus:border-olive focus:outline-none ${
              error ? "border-red-800/60" : "border-espresso/15"
            } ${className}`}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled={rest.required}>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso-muted"
            aria-hidden
          />
        </div>
        {error && <p className="mt-1 font-sans text-xs text-red-800">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
