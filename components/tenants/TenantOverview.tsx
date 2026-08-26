import Link from "next/link";
import { DetailRows } from "@/components/ui/DetailRows";
import type { TenantRow } from "@/lib/queries/tenants";
import type { LeaseListItem } from "@/lib/queries/leases";
import type { TenantContactRow } from "@/lib/queries/tenantContacts";
import { findContactSlot } from "@/lib/utils/tenantContacts";
import { TENANT_RELIGIONS, TENANT_TYPES } from "@/lib/validation/tenant";
import styles from "./TenantOverview.module.css";

const TYPE_LABELS: Record<(typeof TENANT_TYPES)[number], string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Company",
  OTHER: "Other",
  SCHOOL: "School",
  INSTITUTE: "Institute",
  FAMILY: "Family",
};

const RELIGION_LABELS: Record<(typeof TENANT_RELIGIONS)[number], string> = {
  HINDU: "Hindu",
  MUSLIM: "Muslim",
  CHRISTIAN: "Christian",
  SIKH: "Sikh",
  BUDDHIST: "Buddhist",
  JAIN: "Jain",
  PARSI_ZOROASTRIAN: "Parsi / Zoroastrian",
  JEWISH: "Jewish",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

function contactRows(contact: TenantContactRow | null) {
  return [
    { label: "Name", value: contact?.name ?? "" },
    { label: "Phone", value: contact?.phone ?? "" },
    { label: "Address", value: contact?.address ?? "" },
  ].filter((row) => row.value.trim().length > 0);
}

export interface TenantUnitOccupancyDetail {
  currentRent: number | null;
  depositRequired: number | null;
  depositHeld: number | null;
  currencyCode: string;
}

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

/**
 * P6.2-D2: Personal Details / Identity Documents / Emergency Contacts /
 * Local References / Notes are new tenant-profile panels — they never
 * mention Lease/occupancy. Contact Information is left exactly as it was.
 *
 * P6.3-D: the old single-lease "Lease Summary" panel (lease code,
 * agreement dates) is gone — it only ever showed one occupancy and
 * exposed the internal lease code as a user-facing field. "Current
 * Units" is now the one place occupancy/rent/deposit are shown, and it
 * covers every active unit this tenant holds, not just one.
 */
export function TenantOverview({
  tenant,
  leases,
  unitDetails,
  contacts,
}: {
  tenant: TenantRow;
  leases: LeaseListItem[];
  /** Keyed by lease id — never a single tenant-level rent/deposit figure. */
  unitDetails: Record<string, TenantUnitOccupancyDetail>;
  contacts: TenantContactRow[];
}) {
  // P6.3-C/D: every ACTIVE occupancy this tenant currently holds, each
  // independently identifiable and linking to its own Unit — never
  // collapsed into one tenant-level rent/deposit figure. A tenant with
  // multiple active units (fully supported since P6.2-C) shows one row
  // per unit here, each with its own rent/deposit; the full Rent/Billing/
  // Deposit/Exit history for a unit lives on that unit's own detail page.
  const activeUnits = leases.filter((lease) => lease.status === "ACTIVE");

  const contactRowsExisting = [
    { label: "Phone", value: tenant.phone ?? "" },
    { label: "Alternate Phone", value: tenant.alternate_phone ?? "" },
    { label: "Email", value: tenant.email ?? "" },
    {
      label: "Address",
      value: [tenant.address_line_1, tenant.city, tenant.state, tenant.postal_code]
        .filter(Boolean)
        .join(", "),
    },
  ].filter((row) => row.value.trim().length > 0);

  const personalRows = [
    { label: "Date of Birth", value: tenant.date_of_birth ?? "" },
    { label: "Religion", value: tenant.religion ? RELIGION_LABELS[tenant.religion] : "" },
    { label: "No. of Members", value: tenant.member_count != null ? String(tenant.member_count) : "" },
    { label: "Tenant Type", value: TYPE_LABELS[tenant.tenant_type] },
  ].filter((row) => row.value.trim().length > 0);

  const identityDocumentRows = [
    { label: "Aadhaar No.", value: tenant.aadhaar_number ?? "" },
    { label: "PAN No.", value: tenant.pan_number ?? "" },
    { label: "Other Document No.", value: tenant.other_identity_document_number ?? "" },
  ].filter((row) => row.value.trim().length > 0);

  const emergencyContact1Rows = contactRows(findContactSlot(contacts, "EMERGENCY", 1));
  const emergencyContact2Rows = contactRows(findContactSlot(contacts, "EMERGENCY", 2));
  const localReference1Rows = contactRows(findContactSlot(contacts, "LOCAL_REFERENCE", 1));
  const localReference2Rows = contactRows(findContactSlot(contacts, "LOCAL_REFERENCE", 2));

  return (
    <>
      <div className={styles.grid}>
        <div className={styles.column}>
          <div className={styles.heading}>Current Units</div>
          {activeUnits.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeUnits.map((lease) => {
                const detail = unitDetails[lease.id];
                return (
                  <div
                    key={lease.id}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid var(--color-neutral-300)",
                      borderRadius: 4,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <Link href={`/app/units/${lease.unit_id}`} style={{ fontWeight: 600 }}>
                        {lease.units ? `${lease.units.properties?.name ?? ""} · ${lease.units.unit_code}` : "—"}
                      </Link>
                      <span style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
                        Occupancy since {lease.occupancy_start_date}
                      </span>
                    </div>
                    {detail ? (
                      <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12, color: "var(--color-neutral-700)" }}>
                        <span>
                          Rent:{" "}
                          <strong style={{ color: "var(--color-text)" }}>
                            {detail.currentRent != null ? formatCurrency(detail.currentRent, detail.currencyCode) : "—"}
                          </strong>
                        </span>
                        <span>
                          Deposit:{" "}
                          <strong style={{ color: "var(--color-text)" }}>
                            {detail.depositRequired != null
                              ? `${formatCurrency(detail.depositHeld ?? 0, detail.currencyCode)} held of ${formatCurrency(detail.depositRequired, detail.currencyCode)}`
                              : "—"}
                          </strong>
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>This tenant has no active units.</p>
          )}
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>Contact Information</div>
          {contactRowsExisting.length > 0 ? (
            <DetailRows rows={contactRowsExisting} bordered={false} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>No contact details on file.</p>
          )}
        </div>
      </div>

      <div className={styles.grid} style={{ marginTop: 16 }}>
        <div className={styles.column}>
          <div className={styles.heading}>Personal Details</div>
          {personalRows.length > 0 ? (
            <DetailRows rows={personalRows} bordered={false} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>No personal details on file.</p>
          )}
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>Identity Documents</div>
          {identityDocumentRows.length > 0 ? (
            <DetailRows rows={identityDocumentRows} bordered={false} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>No identity documents on file.</p>
          )}
        </div>
      </div>

      <div className={styles.grid} style={{ marginTop: 16 }}>
        <div className={styles.column}>
          <div className={styles.heading}>Emergency Contact 1</div>
          {emergencyContact1Rows.length > 0 ? (
            <DetailRows rows={emergencyContact1Rows} bordered={false} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Not on file.</p>
          )}
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>Emergency Contact 2</div>
          {emergencyContact2Rows.length > 0 ? (
            <DetailRows rows={emergencyContact2Rows} bordered={false} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Not on file.</p>
          )}
        </div>
      </div>

      <div className={styles.grid} style={{ marginTop: 16 }}>
        <div className={styles.column}>
          <div className={styles.heading}>Local Reference 1</div>
          {localReference1Rows.length > 0 ? (
            <DetailRows rows={localReference1Rows} bordered={false} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Not on file.</p>
          )}
        </div>
        <div className={styles.column}>
          <div className={styles.heading}>Local Reference 2</div>
          {localReference2Rows.length > 0 ? (
            <DetailRows rows={localReference2Rows} bordered={false} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Not on file.</p>
          )}
        </div>
      </div>

      {tenant.notes && tenant.notes.trim().length > 0 ? (
        <div className={styles.grid} style={{ marginTop: 16 }}>
          <div className={styles.column}>
            <div className={styles.heading}>Notes</div>
            <p style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{tenant.notes}</p>
          </div>
          <div className={styles.column} />
        </div>
      ) : null}
    </>
  );
}
