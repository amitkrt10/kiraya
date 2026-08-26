"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/Table";
import type { LeaseListItem } from "@/lib/queries/leases";

function matchesSearch(lease: LeaseListItem, term: string): boolean {
  const haystack = [
    lease.tenants?.display_name,
    lease.tenants?.tenant_code,
    lease.lease_code,
    lease.units?.unit_code,
    lease.units?.properties?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(term.toLowerCase());
}

export function NewExitDrawer({ eligibleLeases }: { eligibleLeases: LeaseListItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim();
    return term ? eligibleLeases.filter((lease) => matchesSearch(lease, term)) : eligibleLeases;
  }, [eligibleLeases, search]);

  function selectLease(leaseId: string) {
    setOpen(false);
    router.push(`/app/exits/new?leaseId=${leaseId}`);
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus width={16} height={16} aria-hidden="true" />
        New Exit
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Start a Tenant Exit">
        {eligibleLeases.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="No eligible tenants"
            description="Every active occupancy already has a tenant exit in progress, or there are no active occupancies yet."
          />
        ) : (
          <>
            <Input
              label="Search tenant, property, or unit"
              placeholder="Tenant, property, or unit…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
            />
            {filtered.length === 0 ? (
              <EmptyState title="No matches" description="Try a different search." />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Tenant</TableHeaderCell>
                    <TableHeaderCell>Property</TableHeaderCell>
                    <TableHeaderCell>Unit</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((lease) => (
                    <TableRow
                      key={lease.id}
                      clickable
                      onClick={() => selectLease(lease.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectLease(lease.id);
                        }
                      }}
                    >
                      <TableCell style={{ fontWeight: 600 }}>{lease.tenants?.display_name ?? "—"}</TableCell>
                      <TableCell style={{ color: "var(--color-neutral-700)" }}>
                        {lease.units?.properties?.name ?? "—"}
                      </TableCell>
                      <TableCell style={{ color: "var(--color-neutral-700)" }}>{lease.units?.unit_code ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}
