import type { PropertyRow } from "@/lib/queries/properties";

/** Short "line1, city" style summary used in list rows and header bands. */
export function formatPropertyLocation(property: Pick<PropertyRow, "address_line_1" | "city">): string {
  const parts = [property.address_line_1, property.city].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "No address on file";
}

/** Full multi-line-worthy address string for detail overviews. */
export function formatFullAddress(
  property: Pick<
    PropertyRow,
    "address_line_1" | "address_line_2" | "locality" | "city" | "state" | "postal_code"
  >,
): string {
  const parts = [
    property.address_line_1,
    property.address_line_2,
    property.locality,
    property.city,
    property.state,
    property.postal_code,
  ].filter(Boolean);
  return parts.join(", ");
}
