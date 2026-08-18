import { ReactNode } from "react";
import { Search, Eye } from "lucide-react";
import styles from "./Topbar.module.css";

export interface TopbarProps {
  titleSlot: ReactNode;
  searchPlaceholder?: string;
  actions?: ReactNode;
  userMenu: ReactNode;
  viewOnlyBanner?: string;
}

export function Topbar({ titleSlot, searchPlaceholder, actions, userMenu, viewOnlyBanner }: TopbarProps) {
  return (
    <>
      <header className={styles.topbar}>
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
