import type { PropertyOwnershipItem } from "@/lib/queries/owners";

export function isOwnershipActive(
  ownership: Pick<PropertyOwnershipItem, "ownership_start_date" | "ownership_end_date">,
  asOf: Date = new Date(),
): boolean {
  const today = asOf.toISOString().slice(0, 10);
  const startsOk = !ownership.ownership_start_date || ownership.ownership_start_date <= today;
  const endsOk = !ownership.ownership_end_date || ownership.ownership_end_date >= today;
  return startsOk && endsOk;
}

/** "Owner name" / "Owner name & 2 others" / "No owner assigned" — for the property header band. */
export function summarizeOwners(ownerships: PropertyOwnershipItem[]): string {
  const active = ownerships.filter((ownership) => isOwnershipActive(ownership));
  if (active.length === 0) return "No owner assigned";

  const sorted = [...active].sort((a, b) => b.ownership_percentage - a.ownership_percentage);
  const primaryName = sorted[0]?.owners?.display_name ?? "Unknown owner";
  if (active.length === 1) return primaryName;

  const othersCount = active.length - 1;
  return `${primaryName} & ${othersCount} other${othersCount > 1 ? "s" : ""}`;
}

/** Presentation-only formatting of an already-authoritative percentage value — never recomputed/rounded into a different number. */
export function formatOwnershipPercentage(value: number): string {
  return `${value % 1 === 0 ? value.toFixed(0) : value}%`;
}
