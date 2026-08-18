"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";
import styles from "./Dialog.module.css";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      lastFocused.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
      lastFocused.current?.focus();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className={["dialog", styles.dialog].join(" ")}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        ref.current?.close();
      }}
    >
      <div className={styles.header}>
        <h2 id="dialog-title" className={styles.title}>
          {title}
        </h2>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close dialog"
          onClick={() => ref.current?.close()}
        >
          <X width={18} height={18} />
        </button>
      </div>
      <div className={styles.body}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </dialog>
  );
}
