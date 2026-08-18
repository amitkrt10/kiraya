"use client";

import { useState } from "react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { UnitTable } from "@/components/units/UnitTable";
import { OwnershipTable } from "@/components/properties/OwnershipTable";
import { PropertyOverview } from "./PropertyOverview";
import type { PropertyDetail } from "@/lib/queries/properties";
import type { UnitListItem } from "@/lib/queries/units";
import type { UnitType } from "@/lib/queries/unitTypes";
import type { OwnerRow, PropertyOwnershipItem } from "@/lib/queries/owners";

export interface PropertyDetailTabsProps {
  property: PropertyDetail;
  units: UnitListItem[];
  unitTypes: UnitType[];
  ownerships: PropertyOwnershipItem[];
  owners: OwnerRow[];
  canWrite: boolean;
}

const TABS = [
  { id: "units", label: "Units" },
  { id: "overview", label: "Overview" },
  { id: "owners", label: "Owners" },
  { id: "financials", label: "Financials" },
  { id: "documents", label: "Documents" },
];

export function PropertyDetailTabs({
  property,
  units,
  unitTypes,
  ownerships,
  owners,
  canWrite,
}: PropertyDetailTabsProps) {
  const [activeId, setActiveId] = useState("units");

  return (
    <Tabs tabs={TABS} activeId={activeId} onChange={setActiveId} idPrefix="property-detail">
      <TabPanel id="units" activeId={activeId} idPrefix="property-detail">
        <UnitTable propertyId={property.id} units={units} unitTypes={unitTypes} canWrite={canWrite} />
      </TabPanel>
      <TabPanel id="overview" activeId={activeId} idPrefix="property-detail">
        <PropertyOverview property={property} />
      </TabPanel>
      <TabPanel id="owners" activeId={activeId} idPrefix="property-detail">
        <OwnershipTable
          propertyId={property.id}
          ownerships={ownerships}
          owners={owners}
          canWrite={canWrite}
        />
      </TabPanel>
      <TabPanel id="financials" activeId={activeId} idPrefix="property-detail">
        <PlaceholderPage
          title="Financials"
          description="Billing and collection reporting for this property arrives in a later phase."
        />
      </TabPanel>
      <TabPanel id="documents" activeId={activeId} idPrefix="property-detail">
        <PlaceholderPage
          title="Documents"
          description="Document management for this property arrives in a later phase."
        />
      </TabPanel>
    </Tabs>
  );
}
