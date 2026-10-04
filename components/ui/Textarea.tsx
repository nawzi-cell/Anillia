import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = "", ...rest }, ref) => {
    const inputId = id ?? rest.name;
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
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border bg-white/60 px-4 py-3 font-sans text-sm text-espresso placeholder:text-taupe transition-colors focus:border-olive focus:outline-none ${
            error ? "border-red-800/60" : "border-espresso/15"
          } ${className}`}
          {...rest}
        />
        {error && <p className="mt-1 font-sans text-xs text-red-800">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
