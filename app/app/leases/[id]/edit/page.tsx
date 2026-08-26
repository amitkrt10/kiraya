import { notFound, redirect } from "next/navigation";
import { getRequestContext } from "@/lib/context/current";
import { getLeaseUnitId } from "@/lib/queries/leases";
import { isUuid } from "@/lib/utils/uuid";

/**
 * P6.3-F: retired — the audit found this form's Save action was already
 * broken (parseLeaseFormData() required tenantId/unitId, which this form
 * never submitted, so every save failed validation) — retiring it loses
 * no working capability. Unit Detail's Occupancy tab → Edit Occupancy is
 * the real, working replacement for the fields that were actually
 * meaningful (Occupancy Start Date, Notice/Move-in/Move-out Date, Notes).
 * Redirects to the same place /app/leases/[id] now does, for the same
 * "no orphaned Lease screen, no leaked cross-org distinction" reasons.
 *
 * P6.3-J: same exact-occupancy redirect target as /app/leases/[id] — see
 * that file's comment. An ended lease lands on its own read-only
 * occupancy page (Edit Occupancy correctly does not appear there, since
 * that page only offers write actions for the unit's current ACTIVE
 * lease) rather than exposing the current tenant's edit controls under a
 * historical bookmark.
 */
export default async function EditLeasePage({ params }: { params: Promise<{ id: string }> }) {
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
