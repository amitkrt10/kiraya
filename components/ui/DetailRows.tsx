import styles from "./DetailRows.module.css";

export interface DetailRow {
  label: string;
  value: string;
}

/** Label/value box used by detail-page overview panels. Rows with an empty value should be filtered out by the caller. */
export function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <div className={styles.box}>
      {rows.map((row) => (
        <div key={row.label} className={styles.row}>
          <span className={styles.label}>{row.label}</span>
          <span className={styles.value}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
