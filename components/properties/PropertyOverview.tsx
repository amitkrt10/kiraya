import { DetailRows } from "@/components/ui/DetailRows";
import type { PropertyDetail } from "@/lib/queries/properties";
import { formatFullAddress } from "@/lib/utils/format";

/** Only fields with values are shown — no confusing blank rows (task instruction #18). */
export function PropertyOverview({ property }: { property: PropertyDetail }) {
  const address = formatFullAddress(property);

  const rows = [
    { label: "Property Code", value: property.property_code },
    { label: "Name", value: property.name },
    { label: "Type", value: property.property_types?.name ?? "" },
    { label: "Status", value: property.status },
    { label: "Address", value: address },
    { label: "Country", value: property.country_code },
    {
      label: "Total Area",
      value:
        property.total_area != null
          ? `${property.total_area}${property.area_unit ? ` ${property.area_unit}` : ""}`
          : "",
    },
    { label: "Description", value: property.description ?? "" },
  ].filter((row) => row.value.trim().length > 0);

  return <DetailRows rows={rows} />;
}
