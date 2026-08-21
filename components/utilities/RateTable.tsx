"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { ActiveTag } from "./ActiveTag";
import { useToast } from "@/components/ui/Toast";
import { deactivateUtilityRateAction } from "@/lib/actions/utilityRates";
import type { UtilityRateRow } from "@/lib/queries/utilityRates";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}

export function RateTable({ rates, utilityId, canWrite }: { rates: UtilityRateRow[]; utilityId: string; canWrite: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  function handleDeactivate(rateId: string) {
    startTransition(async () => {
      const result = await deactivateUtilityRateAction(rateId, utilityId);
      if (result.error) {
        show({ message: result.error, variant: "error" });
      } else {
        show({ message: "Rate deactivated.", variant: "success" });
        router.refresh();
      }
    });
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell style={{ textAlign: "right" }}>Rate</TableHeaderCell>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell>Effective From</TableHeaderCell>
          <TableHeaderCell>Effective To</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          {canWrite ? <TableHeaderCell></TableHeaderCell> : null}
        </TableRow>
      </TableHead>
      <TableBody>
        {rates.map((rate) => (
          <TableRow key={rate.id}>
            <TableCell numeric>{formatCurrency(rate.rate)}</TableCell>
            <TableCell>{rate.unit_name}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{rate.effective_from}</TableCell>
            <TableCell style={{ color: "var(--color-neutral-700)" }}>{rate.effective_to ?? "Ongoing"}</TableCell>
            <TableCell>
              <ActiveTag active={rate.is_active} />
            </TableCell>
            {canWrite ? (
              <TableCell>
                {rate.is_active ? (
                  <Button variant="secondary" onClick={() => handleDeactivate(rate.id)} loading={isPending}>
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
