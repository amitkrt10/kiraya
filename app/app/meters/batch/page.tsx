import { Gauge } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getPropertiesForPicker } from "@/lib/queries/properties";
import { getMetersForProperty } from "@/lib/queries/meters";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PermissionDenied } from "@/components/ui/ErrorState";
import { BatchReadingForm } from "@/components/meters/BatchReadingForm";
import { isUuid } from "@/lib/utils/uuid";

interface BatchPageSearchParams {
  propertyId?: string;
  date?: string;
}

export default async function BatchReadingPage({
  searchParams,
}: {
  searchParams: Promise<BatchPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const canWrite = await canWriteOrganization(organizationId);

  if (!canWrite) {
    return <PermissionDenied description="You don't have permission to record meter readings in this organization." />;
  }

  const properties = await getPropertiesForPicker(organizationId);
  const hasSelection = Boolean(params.propertyId && params.date && isUuid(params.propertyId));

  const meters = hasSelection ? await getMetersForProperty(params.propertyId!, organizationId) : [];
  const selectedProperty = properties.find((property) => property.id === params.propertyId);

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginBottom: 6 }}>Utilities &amp; Meters / Meters / Batch Reading</div>
      <h1 style={{ fontSize: 22, fontFamily: "var(--font-heading)", fontWeight: 700, marginBottom: 6 }}>
        {hasSelection ? `Batch Reading — ${selectedProperty?.name ?? ""}` : "Batch Reading"}
      </h1>

      <div
        style={{
          borderLeft: "2px solid var(--color-neutral-700)",
          background: "var(--color-neutral-100)",
          padding: "10px 14px",
          fontSize: 12,
          color: "var(--color-neutral-700)",
          margin: "14px 0 24px",
        }}
      >
        Each reading is validated and saved <strong>independently</strong> — there is no combined all-or-nothing submission. Rows already marked Saved are
        final; fix and resubmit only the rows still in error.
      </div>

      <form method="GET" style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 24 }}>
        <div style={{ width: 280 }}>
          <Select
            label="Property"
            name="propertyId"
            required
            defaultValue={params.propertyId ?? ""}
            placeholder="Select a property…"
            options={properties.map((property) => ({ value: property.id, label: property.name }))}
          />
        </div>
        <div style={{ width: 200 }}>
          <Input label="Reading Date" name="date" type="date" required defaultValue={params.date ?? ""} />
        </div>
        <Button variant="secondary" type="submit">
          Load Meters
        </Button>
      </form>

      {!hasSelection ? null : meters.length === 0 ? (
        <EmptyState icon={Gauge} title="No active meters at this property" description="This property has no active meters installed on it or its units." />
      ) : (
        <BatchReadingForm propertyId={params.propertyId!} readingDate={params.date!} meters={meters} />
      )}
    </div>
  );
}
