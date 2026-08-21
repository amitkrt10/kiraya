import { notFound } from "next/navigation";
import { Gauge, Zap, Info } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getUtility } from "@/lib/queries/utilities";
import { getUtilityConfigurationsForUtility, getOverridingUnitLabels } from "@/lib/queries/utilityConfigurations";
import { getUtilityRatesForUtility } from "@/lib/queries/utilityRates";
import { getPropertiesForPicker } from "@/lib/queries/properties";
import { getUnitsForPicker } from "@/lib/queries/units";
import { Tag } from "@/components/ui/Tag";
import { ConfigurationTable } from "@/components/utilities/ConfigurationTable";
import { CreateConfigurationDialog } from "@/components/utilities/CreateConfigurationDialog";
import { RateTable } from "@/components/utilities/RateTable";
import { CreateRateDialog } from "@/components/utilities/CreateRateDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { isUuid } from "@/lib/utils/uuid";

export default async function UtilityConfigurationPage({ params }: { params: Promise<{ utilityId: string }> }) {
  const { utilityId } = await params;
  if (!isUuid(utilityId)) {
    notFound();
  }

  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;

  const utility = await getUtility(utilityId, organizationId);
  if (!utility) {
    notFound();
  }

  const [configurations, rates, properties, units, canWrite] = await Promise.all([
    getUtilityConfigurationsForUtility(utilityId, organizationId),
    getUtilityRatesForUtility(utilityId, organizationId),
    getPropertiesForPicker(organizationId),
    getUnitsForPicker(organizationId),
    canWriteOrganization(organizationId),
  ]);

  const propertyConfigs = configurations.filter((config) => config.unit_id === null);
  const unitConfigs = configurations.filter((config) => config.unit_id !== null);
  const overriddenAt = getOverridingUnitLabels(configurations);

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginBottom: 6 }}>
        Utilities &amp; Meters / {utility.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontSize: 22, fontFamily: "var(--font-heading)", fontWeight: 700 }}>{utility.name}</h1>
          {utility.is_metered ? (
            <Tag variant="accent" icon={Gauge}>
              Metered
            </Tag>
          ) : (
            <Tag variant="outline" icon={Zap}>
              Fixed
            </Tag>
          )}
        </div>
        {canWrite ? <CreateConfigurationDialog utilityId={utilityId} properties={properties} units={units} /> : null}
      </div>

      <div
        style={{
          borderLeft: "2px solid var(--color-neutral-700)",
          background: "var(--color-neutral-100)",
          padding: "10px 14px",
          fontSize: 12,
          color: "var(--color-neutral-700)",
          display: "flex",
          gap: 8,
          marginBottom: 24,
        }}
      >
        <Info width={16} height={16} style={{ flex: "0 0 auto", marginTop: 1 }} aria-hidden="true" />
        <span>
          Unit-level configuration overrides the property default for the same utility and billing period. Editing or deactivating a configuration only
          affects future bills — already-generated charges never change.
        </span>
      </div>

      <h2 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-neutral-700)", marginBottom: 10 }}>
        Property Default
      </h2>
      {propertyConfigs.length === 0 ? (
        <EmptyState icon={Gauge} title="No property default configured" description="This utility has no property-level configuration yet." />
      ) : (
        <>
          <ConfigurationTable configurations={propertyConfigs} scope="PROPERTY" canWrite={canWrite} />
          {overriddenAt.length > 0 ? (
            <p style={{ fontSize: 12, color: "var(--color-neutral-700)", margin: "8px 0 0", paddingLeft: 2 }}>Overridden at: {overriddenAt.join(", ")}</p>
          ) : null}
        </>
      )}

      <h2 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-neutral-700)", margin: "24px 0 10px" }}>
        Unit Overrides
      </h2>
      {unitConfigs.length === 0 ? (
        <EmptyState icon={Gauge} title="No unit overrides yet" description="No unit currently overrides the property default for this utility." />
      ) : (
        <ConfigurationTable configurations={unitConfigs} scope="UNIT" canWrite={canWrite} />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "28px 0 10px" }}>
        <h2 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-neutral-700)" }}>Rates</h2>
        {canWrite ? <CreateRateDialog utilityId={utilityId} /> : null}
      </div>
      {rates.length === 0 ? (
        <EmptyState icon={Gauge} title="No rates recorded yet" description="Metered charges need at least one rate to compute a charge." />
      ) : (
        <RateTable rates={rates} utilityId={utilityId} canWrite={canWrite} />
      )}
    </div>
  );
}
