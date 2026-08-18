"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import styles from "./Toast.module.css";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  /** Financial-action toasts persist until dismissed instead of auto-timing out. */
  persist?: boolean;
}

interface ToastItem extends Required<Omit<ToastOptions, "persist">> {
  id: string;
  persist: boolean;
}

interface ToastContextValue {
  show: (toast: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantIcon = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
} as const;

const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback(
    ({ message, variant = "info", persist = false }: ToastOptions) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, variant, persist }]);
      if (!persist) {
        timers.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = variantIcon[toast.variant];
          return (
            <div key={toast.id} role="status" className={[styles.toast, styles[toast.variant]].join(" ")}>
              <Icon width={18} height={18} className={styles.icon} aria-hidden="true" />
              <div className={styles.message}>{toast.message}</div>
              <button
                type="button"
                className={styles.dismiss}
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
              >
                <X width={14} height={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
