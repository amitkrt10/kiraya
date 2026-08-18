import { PropertyFormDrawer } from "./PropertyFormDrawer";
import { PropertyStatusTag } from "./PropertyStatusTag";
import type { PropertyDetail } from "@/lib/queries/properties";
import type { PropertyOwnershipItem } from "@/lib/queries/owners";
import type { PropertyType } from "@/lib/queries/propertyTypes";
import { formatPropertyLocation } from "@/lib/utils/format";
import { summarizeOwners } from "@/lib/utils/ownership";
import styles from "./PropertyHeaderBand.module.css";

export function PropertyHeaderBand({
  property,
  ownerships,
  propertyTypes,
  canWrite,
}: {
  property: PropertyDetail;
  ownerships: PropertyOwnershipItem[];
  propertyTypes: PropertyType[];
  canWrite: boolean;
}) {
  return (
    <div className={styles.band}>
      <div>
        <div className={styles.titleRow}>
          <div className={styles.name}>{property.name}</div>
          {property.property_types ? (
            <span className="tag tag-neutral">{property.property_types.name}</span>
          ) : null}
          <PropertyStatusTag status={property.status} />
        </div>
        <div className={styles.meta}>
          {formatPropertyLocation(property)} · Owner: {summarizeOwners(ownerships)}
        </div>
      </div>
      {canWrite ? (
        <PropertyFormDrawer mode="edit" property={property} propertyTypes={propertyTypes} />
      ) : null}
    </div>
  );
}
