import styles from "./DetailRows.module.css";

export interface DetailRow {
  label: string;
  value: string;
}

export interface DetailRowsProps {
  rows: DetailRow[];
  /** Set false when already nested inside another bordered container (e.g. a 2-column panel) to avoid a double border. */
  bordered?: boolean;
}

/** Label/value list used by detail-page overview panels. Rows with an empty value should be filtered out by the caller. */
export function DetailRows({ rows, bordered = true }: DetailRowsProps) {
  return (
    <div className={bordered ? styles.box : undefined}>
      {rows.map((row) => (
        <div key={row.label} className={styles.row}>
          <span className={styles.label}>{row.label}</span>
          <span className={styles.value}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
