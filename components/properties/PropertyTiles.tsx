import type { PropertyUnitCounts } from "@/lib/queries/properties";
import styles from "./PropertyTiles.module.css";

/**
 * Total Units, Occupied Units, Vacant Units, Occupancy % — per P5.2B scope,
 * the design's original 4th/5th tiles (Tenants, Outstanding) are financial/
 * tenant metrics that belong to a later phase, not invented here.
 */
export function PropertyTiles({ counts }: { counts: PropertyUnitCounts }) {
  const tiles = [
    { label: "Total Units", value: counts.totalUnits.toString() },
    { label: "Occupied Units", value: counts.occupiedUnits.toString() },
    { label: "Vacant Units", value: counts.vacantUnits.toString() },
    { label: "Occupancy", value: `${counts.occupancyPercentage}%` },
  ];

  return (
    <div className={styles.tiles}>
      {tiles.map((tile) => (
        <div key={tile.label} className={styles.tile}>
          <div className={styles.label}>{tile.label}</div>
          <div className={styles.value}>{tile.value}</div>
        </div>
      ))}
    </div>
  );
}
