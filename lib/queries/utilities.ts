import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type UtilityRow = Database["kiraya"]["Tables"]["utilities"]["Row"];

const DEFAULT_PAGE_SIZE = 25;

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, (match) => `\\${match}`);
}

export interface UtilityListItem extends UtilityRow {
  configuration_count: number;
}

export interface GetUtilitiesParams {
  organizationId: string;
  search?: string;
  status?: "active" | "inactive";
  page?: number;
  pageSize?: number;
}

export interface GetUtilitiesResult {
  utilities: UtilityListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Org-wide utility catalog. utilities_select RLS already returns both this
 * org's own entries AND any shared/system utility (organization_id IS
 * NULL) — no client-side org filtering needed beyond what RLS already
 * enforces, matching how kiraya.validate_utility_configuration_organization()
 * treats a NULL utility organization_id as globally shared.
 */
export async function getUtilities(params: GetUtilitiesParams): Promise<GetUtilitiesResult> {
  const { search, status } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase.from("utilities").select("*", { count: "exact" });

  if (search && search.trim().length > 0) {
    query = query.ilike("name", `%${escapeIlike(search.trim())}%`);
  }
  if (status) {
    query = query.eq("is_active", status === "active");
  }

  const { data, error, count } = await query.order("sort_order", { ascending: true }).order("name", { ascending: true }).range(from, to);

  if (error) {
    throw new Error(`Failed to load utilities: ${error.message}`);
  }

  const rows = data ?? [];
  const counts = await Promise.all(
    rows.map(async (row) => {
      const { count: configCount, error: configError } = await supabase
        .from("utility_configurations")
        .select("id", { count: "exact", head: true })
        .eq("utility_id", row.id);
      if (configError) {
        throw new Error(`Failed to load configuration count: ${configError.message}`);
      }
      return configCount ?? 0;
    }),
  );

  const utilities: UtilityListItem[] = rows.map((row, index) => ({ ...row, configuration_count: counts[index] ?? 0 }));

  return { utilities, totalCount: count ?? 0, page, pageSize };
}

/** Scoped explicitly to what RLS already allows (own-org or shared) — same not-found-vs-leak reasoning as getTenant()/getLease(). */
export async function getUtility(utilityId: string, organizationId: string): Promise<UtilityRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utilities")
    .select("*")
    .eq("id", utilityId)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(`Failed to load utility: ${error.message}`);
  }

  return data;
}

/** Lightweight, unpaginated utility list for pickers/filters — same shape as getPropertiesForPicker()/getUnitsForPicker(). */
export async function getUtilitiesForPicker(organizationId: string): Promise<UtilityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("utilities")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load utilities: ${error.message}`);
  }

  return data ?? [];
}
