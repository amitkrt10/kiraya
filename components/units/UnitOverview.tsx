import { DetailRows } from "@/components/ui/DetailRows";
import type { UnitDetail } from "@/lib/queries/units";

const STATUS_LABELS: Record<UnitDetail["status"], string> = {
  VACANT: "Vacant",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
  UNAVAILABLE: "Unavailable",
};

export function UnitOverview({ unit }: { unit: UnitDetail }) {
  const rows = [
    { label: "Unit Code", value: unit.unit_code },
    { label: "Property", value: unit.properties?.name ?? "" },
    { label: "Unit Type", value: unit.unit_types?.name ?? "" },
    { label: "Status", value: STATUS_LABELS[unit.status] },
    { label: "Floor", value: unit.floor_number != null ? String(unit.floor_number) : "" },
    {
      label: "Area",
      value: unit.area != null ? `${unit.area}${unit.area_unit ? ` ${unit.area_unit}` : ""}` : "",
    },
    { label: "Bedrooms", value: unit.bedrooms != null ? String(unit.bedrooms) : "" },
    { label: "Bathrooms", value: unit.bathrooms != null ? String(unit.bathrooms) : "" },
    { label: "Description", value: unit.description ?? "" },
  ].filter((row) => row.value.trim().length > 0);

  return <DetailRows rows={rows} />;
}
