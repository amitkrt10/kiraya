import { notFound, redirect } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { getLeaseUnitId } from "@/lib/queries/leases";
import { isUuid } from "@/lib/utils/uuid";

/**
 * P6.3-F: retired — Unit Detail's Occupancy tab (plus its Rent/Billing/
 * Deposit/Exit tabs, P6.3-D) is now the complete replacement, verified
 * against every field this page used to show. Redirects rather than
 * 404s so a stale bookmark/link to a real historical lease still lands
 * somewhere useful; an invalid or inaccessible id still gets the normal
 * not-found behavior (never a distinguishable cross-org leak). The
 * underlying kiraya.leases row and this route's now-unused components
 * (LeaseHeaderBand/LeaseDetailTabs/LeaseOverview/LeasePartiesTable) are
 * untouched — only this page's own content changed.
 *
 * P6.3-J: redirects into the exact occupancy
 * (`/app/units/{unitId}/occupancies/{leaseId}`), not the bare unit page.
 * The bare `/app/units/{unitId}` only ever shows whichever lease is
 * ACTIVE *today* — for an old bookmark to a since-ended, since-reassigned
 * occupancy, that silently substituted a different tenant's current data
 * with no indication anything had changed (reproduced live by the P6.3-I
 * audit). This id is always still exactly the lease the user asked for.
 */
export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const unitId = await getLeaseUnitId(id, context.organization.organizationId);
  if (!unitId) {
    notFound();
  }

  redirect(`/app/units/${unitId}/occupancies/${id}`);
}
