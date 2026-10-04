import { forwardRef, type SelectHTMLAttributes } from "react";

interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  function AdminSelect({ label, hint, error, id, className = "", children, ...rest }, ref) {
    const inputId = id || `select-${label?.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block font-sans text-xs font-semibold uppercase tracking-wider text-espresso-muted"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={`w-full rounded-md border bg-ivory-light px-3 py-2 font-sans text-sm text-espresso transition focus:border-olive focus:outline-none ${
            error ? "border-red-700/60" : "border-espresso/15"
          }`}
          {...rest}
        >
          {children}
        </select>
        {hint && !error && (
          <p className="mt-1 text-xs text-espresso-muted">{hint}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
    );
  },
);
