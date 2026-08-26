import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UnitFormDrawer } from "./UnitFormDrawer";
import { UnitStatusTag } from "./UnitStatusTag";
import { deriveUnitOccupancyStatus } from "@/lib/utils/unitStatus";
import type { UnitDetail } from "@/lib/queries/units";
import type { UnitType } from "@/lib/queries/unitTypes";
import styles from "@/components/properties/PropertyHeaderBand.module.css";

export function UnitHeaderBand({
  unit,
  unitTypes,
  canWrite,
  isOccupied,
}: {
  unit: UnitDetail;
  unitTypes: UnitType[];
  canWrite: boolean;
  /** P6.3-H: whether the unit currently has an ACTIVE lease — the authoritative occupancy signal, never unit.status alone. */
  isOccupied: boolean;
}) {
  return (
    <div>
      {unit.properties ? (
        <Link
          href={`/app/properties/${unit.properties.id}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 12 }}
        >
          <ArrowLeft width={14} height={14} aria-hidden="true" />
          {unit.properties.name}
        </Link>
      ) : null}
      <div className={styles.band}>
        <div>
          <div className={styles.titleRow}>
            <div className={styles.name}>{unit.unit_code}</div>
            {unit.unit_types ? <span className="tag tag-neutral">{unit.unit_types.name}</span> : null}
            <UnitStatusTag status={deriveUnitOccupancyStatus(unit.status, isOccupied)} />
          </div>
          {unit.properties ? (
            <div className={styles.meta}>
              {unit.properties.property_code} · {unit.properties.name}
            </div>
          ) : null}
        </div>
        {canWrite ? <UnitFormDrawer mode="edit" propertyId={unit.property_id} unit={unit} unitTypes={unitTypes} /> : null}
      </div>
    </div>
  );
}
