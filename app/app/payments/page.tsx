import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import { getRequestContext } from "@/lib/context/current";
import { canWriteOrganization } from "@/lib/permissions/resolve";
import { getPayments, type PaymentStatus } from "@/lib/queries/payments";
import { PaymentTable } from "@/components/payments/PaymentTable";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

interface PaymentsPageSearchParams {
  q?: string;
  status?: string;
  page?: string;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<PaymentsPageSearchParams>;
}) {
  const params = await searchParams;
  const context = await getRequestContext();
  if (!context?.organization) {
    return null;
  }

  const organizationId = context.organization.organizationId;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [result, canWrite] = await Promise.all([
    getPayments({
      organizationId,
      search: params.q,
      status: params.status as PaymentStatus | undefined,
      page,
    }),
    canWriteOrganization(organizationId),
  ]);

  const hasFilters = Boolean(params.q || params.status);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status) query.set("status", params.status);
    if (nextPage > 1) query.set("page", String(nextPage));
    const search = query.toString();
    return search ? `/app/payments?${search}` : "/app/payments";
  }

  return (
    <div>
      {canWrite ? (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
          <Link href="/app/payments/methods">
            <Button variant="secondary">Payment Methods</Button>
          </Link>
          <Link href="/app/payments/new">
            <Button variant="primary">
              <Plus width={16} height={16} aria-hidden="true" />
              Record Payment
            </Button>
          </Link>
        </div>
      ) : null}

      <PaymentFilters />

      {result.payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={hasFilters ? "No payments match your filters" : "No payments yet"}
          description={
            hasFilters ? "Try adjusting your search or filters." : "Record your first payment against a tenant."
          }
          action={
            !hasFilters && canWrite ? (
              <Link href="/app/payments/new">
                <Button variant="primary">
                  <Plus width={16} height={16} aria-hidden="true" />
                  Record Payment
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <PaymentTable payments={result.payments} />
          <Pagination page={result.page} pageSize={result.pageSize} totalCount={result.totalCount} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
