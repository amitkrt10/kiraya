import { ReactNode } from "react";
import { Search, Eye, Menu, X } from "lucide-react";
import styles from "./Topbar.module.css";

export interface TopbarProps {
  titleSlot: ReactNode;
  searchPlaceholder?: string;
  actions?: ReactNode;
  userMenu: ReactNode;
  viewOnlyBanner?: string;
  /** Only rendered (and only visible, via CSS, below the sidebar's collapse breakpoint) when the caller wires up mobile-nav state. */
  mobileNavOpen?: boolean;
  onMobileNavToggle?: () => void;
}

export function Topbar({
  titleSlot,
  searchPlaceholder,
  actions,
  userMenu,
  viewOnlyBanner,
  mobileNavOpen,
  onMobileNavToggle,
}: TopbarProps) {
  return (
    <>
      <header className={styles.topbar}>
        {onMobileNavToggle ? (
          <button
            type="button"
            className={styles.menuButton}
            onClick={onMobileNavToggle}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X width={18} height={18} aria-hidden="true" /> : <Menu width={18} height={18} aria-hidden="true" />}
          </button>
        ) : null}
        {titleSlot}
        <div className={styles.actions}>
          {searchPlaceholder ? (
            <div className={styles.searchWrapper}>
              <input
                type="search"
                className={["input", styles.searchInput].join(" ")}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
              <Search width={16} height={16} className={styles.searchIcon} aria-hidden="true" />
            </div>
          ) : null}
          {actions}
          {userMenu}
        </div>
      </header>
      {viewOnlyBanner ? (
        <div className={styles.viewerBanner}>
          <Eye width={16} height={16} aria-hidden="true" />
          {viewOnlyBanner}
        </div>
      ) : null}
    </>
  );
}
