import { Skeleton } from "@/components/ui/Skeleton";
import styles from "@/components/dashboard/DashboardKpiStrip.module.css";
import layoutStyles from "@/components/dashboard/DashboardLayout.module.css";

export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className={styles.tiles}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.tile}>
            <Skeleton width="60%" height={11} />
            <div style={{ marginTop: 8 }}>
              <Skeleton width="70%" height={26} />
            </div>
          </div>
        ))}
      </div>

      <div className={layoutStyles.twoColumn}>
        <div className={layoutStyles.left}>
          <Skeleton height={16} width="40%" />
          <div style={{ marginTop: 20 }}>
            <Skeleton height={160} />
          </div>
        </div>
        <div className={layoutStyles.right}>
          <Skeleton height={16} width="60%" />
          <div style={{ marginTop: 20 }}>
            <Skeleton height={120} />
          </div>
        </div>
      </div>

      <div className={layoutStyles.panel}>
        <Skeleton height={16} width="30%" />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={56} />
        </div>
      </div>
    </div>
  );
}
