import { NextRequest } from "next/server";
import { getRequestContext } from "@/lib/context/current";
import { getLedgerEntriesForExport, type LedgerEntryType } from "@/lib/queries/ledger";
import { toCsv } from "@/lib/utils/csv";

const CSV_HEADER = ["Date", "Description", "Tenant", "Type", "Reference", "Debit", "Credit", "Running Balance"];

/**
 * Exports the same authoritative rows the Ledger table shows — same query
 * layer, same filters, read straight from kiraya.v_tenant_ledger. Never
 * queries ledger_entries directly, never recomputes running_balance.
 */
export async function GET(request: NextRequest) {
  const context = await getRequestContext();
  if (!context?.organization) {
    return new Response("Not authorized.", { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const entries = await getLedgerEntriesForExport({
    organizationId: context.organization.organizationId,
    tenantId: searchParams.get("tenant") ?? undefined,
    propertyId: searchParams.get("property") ?? undefined,
    unitId: searchParams.get("unit") ?? undefined,
    entryType: (searchParams.get("type") as LedgerEntryType | null) ?? undefined,
    dateFrom: searchParams.get("from") ?? undefined,
    dateTo: searchParams.get("to") ?? undefined,
  });

  const rows = entries.map((entry) => [
    entry.entry_date ?? "",
    entry.description ?? "",
    entry.tenant_name ?? "",
    entry.entry_type ?? "",
    entry.reference_code ?? "",
    entry.debit_amount ? entry.debit_amount.toFixed(2) : "",
    entry.credit_amount ? entry.credit_amount.toFixed(2) : "",
    entry.running_balance != null ? entry.running_balance.toFixed(2) : "",
  ]);

  const csv = toCsv(CSV_HEADER, rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ledger.csv"',
    },
  });
}
