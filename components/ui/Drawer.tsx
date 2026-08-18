"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import styles from "./Drawer.module.css";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  // Must be unique per instance — multiple Drawers are routinely mounted
  // simultaneously (e.g. a detail page's edit drawer alongside a nested
  // table's create drawer), and a hardcoded id broke aria-labelledby
  // resolution (the browser resolves duplicate ids to the first one in the
  // document, so every drawer's accessible name collapsed to whichever one
  // rendered first — confirmed via live testing, not hypothetical).
  const titleId = useId();

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
      className={["dialog", styles.drawer].join(" ")}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        ref.current?.close();
      }}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close panel"
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
