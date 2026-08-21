"use client";

import { useTransition } from "react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { ActiveTag } from "./ActiveTag";
import { Gauge, Zap } from "lucide-react";
import { deactivateUtilityConfigurationAction } from "@/lib/actions/utilityConfigurations";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import type { UtilityConfigurationListItem } from "@/lib/queries/utilityConfigurations";

function formatCurrency(amount: number | null, currencyCode = "INR"): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(amount);
}

const CHARGING_METHOD_LABELS: Record<string, string> = {
  FIXED: "Fixed",
  SUB_METER: "Sub-Meter",
  SELF_METER: "Self-Meter",
  OTHER: "Other",
};

export function ConfigurationTable({
  configurations,
  scope,
  canWrite,
}: {
  configurations: UtilityConfigurationListItem[];
  scope: "PROPERTY" | "UNIT";
  canWrite: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  function handleDeactivate(configurationId: string, utilityId: string) {
    startTransition(async () => {
      const result = await deactivateUtilityConfigurationAction(configurationId, utilityId);
      if (result.error) {
        show({ message: result.error, variant: "error" });
      } else {
        show({ message: "Configuration deactivated.", variant: "success" });
        router.refresh();
      }
    });
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{scope === "PROPERTY" ? "Property" : "Unit"}</TableHeaderCell>
          <TableHeaderCell>Charging Method</TableHeaderCell>
          <TableHeaderCell style={{ textAlign: "right" }}>Fixed Amount</TableHeaderCell>
          <TableHeaderCell>Effective From</TableHeaderCell>
          <TableHeaderCell>Effective To</TableHeaderCell>
          <TableHeaderCell>Chargeable</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          {canWrite ? <TableHeaderCell></TableHeaderCell> : null}
        </TableRow>
      </TableHead>
      <TableBody>
        {configurations.map((config) => (
          <TableRow key={config.id}>
            <TableCell style={{ fontWeight: 600 }}>{scope === "PROPERTY" ? config.properties?.name ?? "—" : config.units?.unit_code ?? "—"}</TableCell>
            <TableCell>
              {config.meter_type === "FIXED" ? (
                <Tag variant="outline" icon={Zap}>
                  Fixed
                </Tag>
              ) : (
                <Tag variant="accent" icon={Gauge}>
                  {CHARGING_METHOD_LABELS[config.meter_type] ?? config.meter_type}
                </Tag>
              )}
            </TableCell>
            <TableCell numeric>{formatCurrency(config.fixed_amount)}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{config.effective_from}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{config.effective_to ?? "Ongoing"}</TableCell>
            <TableCell>
              {config.is_tenant_chargeable ? (
                <Tag variant="neutral" icon={Gauge}>
                  Yes
                </Tag>
              ) : (
                <Tag variant="outline" icon={Gauge}>
                  No
                </Tag>
              )}
            </TableCell>
            <TableCell>
              <ActiveTag active={config.is_active} />
            </TableCell>
            {canWrite ? (
              <TableCell>
                {config.is_active ? (
                  <Button variant="secondary" onClick={() => handleDeactivate(config.id, config.utility_id)} loading={isPending}>
                    Deactivate
                  </Button>
                ) : null}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
