import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PaymentStatus = Database["kiraya"]["Enums"]["payment_status"];
export type PaymentRow = Database["kiraya"]["Tables"]["payments"]["Row"];
export type PaymentAllocationRow = Database["kiraya"]["Tables"]["payment_allocations"]["Row"];

export interface PaymentListItem extends PaymentRow {
  tenants: { id: string; display_name: string; tenant_code: string } | null;
  payment_methods: { name: string } | null;
}

export interface GetPaymentsParams {
  organizationId: string;
  search?: string;
  status?: PaymentStatus;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}

export interface GetPaymentsResult {
  payments: PaymentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 25;

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}

const PAYMENT_LIST_SELECT = "*, tenants(id, display_name, tenant_code), payment_methods(name)";

export async function getPayments(params: GetPaymentsParams): Promise<GetPaymentsResult> {
  const { organizationId, search, status, tenantId } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase.from("payments").select(PAYMENT_LIST_SELECT, { count: "exact" }).eq("organization_id", organizationId);

  if (search && search.trim().length > 0) {
    query = query.ilike("payment_number", `%${escapeIlike(search.trim())}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error, count } = await query.order("payment_date", { ascending: false }).range(from, to);

  if (error) {
    throw new Error(`Failed to load payments: ${error.message}`);
  }

  return { payments: data ?? [], totalCount: count ?? 0, page, pageSize };
}

export interface PaymentDetail extends PaymentRow {
  tenants: { id: string; display_name: string; tenant_code: string } | null;
  payment_methods: { id: string; name: string; method_type: string } | null;
}

/** Scoped to the organization explicitly — same not-found-vs-leak reasoning as getBill()/getTenant(). */
export async function getPayment(paymentId: string, organizationId: string): Promise<PaymentDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, tenants(id, display_name, tenant_code), payment_methods(id, name, method_type)")
    .eq("id", paymentId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load payment: ${error.message}`);
  }

  return data;
}

export interface PaymentAllocationItem extends PaymentAllocationRow {
  bills: { id: string; bill_number: string; period_start: string; period_end: string } | null;
}

/** This payment's allocations — the automatic oldest-bill-first result of kiraya.allocate_payment_to_bills(). */
export async function getPaymentAllocations(paymentId: string, organizationId: string): Promise<PaymentAllocationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_allocations")
    .select("*, bills(id, bill_number, period_start, period_end)")
    .eq("payment_id", paymentId)
    .eq("organization_id", organizationId)
    .order("allocation_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load payment allocations: ${error.message}`);
  }

  return data ?? [];
}

/** All payments for one tenant — used by the Tenant Detail Payments tab. */
export async function getTenantPayments(tenantId: string, organizationId: string): Promise<PaymentListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_LIST_SELECT)
    .eq("tenant_id", tenantId)
    .eq("organization_id", organizationId)
    .order("payment_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load tenant payments: ${error.message}`);
  }

  return data ?? [];
}

export interface BillPaymentApplied {
  allocatedAmount: number;
  allocationDate: string;
  paymentId: string;
  paymentNumber: string;
  paymentDate: string;
  paymentStatus: PaymentStatus;
  methodName: string | null;
  referenceNumber: string | null;
}

/** Payments applied to one bill — used by Bill Detail's "Payments Applied" table. */
export async function getBillPaymentsApplied(billId: string, organizationId: string): Promise<BillPaymentApplied[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_allocations")
    .select("allocated_amount, allocation_date, payments(id, payment_number, payment_date, status, reference_number, payment_methods(name))")
    .eq("bill_id", billId)
    .eq("organization_id", organizationId)
    .order("allocation_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load payments applied to this bill: ${error.message}`);
  }

  return (data ?? [])
    .filter((row) => row.payments)
    .map((row) => ({
      allocatedAmount: row.allocated_amount,
      allocationDate: row.allocation_date,
      paymentId: row.payments!.id,
      paymentNumber: row.payments!.payment_number,
      paymentDate: row.payments!.payment_date,
      paymentStatus: row.payments!.status,
      methodName: row.payments!.payment_methods?.name ?? null,
      referenceNumber: row.payments!.reference_number,
    }));
}
