"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const kindStyles: Record<ToastKind, { icon: typeof Info; bar: string }> = {
  success: { icon: CheckCircle2, bar: "text-olive" },
  error: { icon: AlertCircle, bar: "text-red-700" },
  info: { icon: Info, bar: "text-taupe-dark" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, kind: ToastKind) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const value: ToastContextValue = {
    toast: (message, kind = "info") => push(message, kind),
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
    info: (message) => push(message, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2"
      >
        {toasts.map((t) => {
          const { icon: Icon, bar } = kindStyles[t.kind];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-lg border border-espresso/10 bg-espresso px-4 py-3 text-ivory shadow-xl"
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${bar}`} />
              <p className="flex-1 text-sm leading-snug">{t.message}</p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() =>
                  setToasts((prev) => prev.filter((x) => x.id !== t.id))
                }
                className="shrink-0 text-ivory/60 transition hover:text-ivory"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
