"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import styles from "./UserMenu.module.css";

export interface UserMenuProps {
  name: string;
  roleLabel: string;
  initials: string;
}

export function UserMenu({ name, roleLabel, initials }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu — ${name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <ChevronDown width={16} height={16} aria-hidden="true" />
      </button>
      {open ? (
        <div role="menu" className={styles.menu}>
          <div className={styles.menuHeader}>
            <div className={styles.menuName}>{name}</div>
            <div className={styles.menuRole}>{roleLabel}</div>
          </div>
          <form action={signOutAction}>
            <button type="submit" role="menuitem" className={styles.menuItem}>
              <LogOut width={14} height={14} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
