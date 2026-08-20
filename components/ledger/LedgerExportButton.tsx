import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** A plain GET link to the export Route Handler — no client JS needed for a same-origin file download. */
export function LedgerExportButton({ query }: { query: Record<string, string | undefined> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  const href = search ? `/app/ledger/export?${search}` : "/app/ledger/export";

  return (
    <a href={href}>
      <Button variant="secondary">
        <Download width={16} height={16} aria-hidden="true" />
        Export CSV
      </Button>
    </a>
  );
}
