/**
 * Simple presentational date-proximity check (not a financial calculation)
 * matching the design's "expiry tag if <30 days" rule for the lease list.
 * A dedicated authoritative view (kiraya.v_lease_expiry_alerts, with a
 * richer 7/30/60/90-day taxonomy) already exists for a future Reports
 * module — this is intentionally simpler, matching just what the list
 * needs today.
 */
export function isLeaseExpiringSoon(agreementEndDate: string | null, status: string): boolean {
  if (status !== "ACTIVE" || !agreementEndDate) return false;
  const end = new Date(`${agreementEndDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil <= 30;
}
