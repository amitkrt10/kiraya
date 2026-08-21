import type { PostgrestError } from "@supabase/supabase-js";

export type MutationResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
const FOREIGN_KEY_VIOLATION = "23503";
const EXCLUSION_VIOLATION = "23P01";
const INVALID_DATETIME = "22007";
const INVALID_PARAMETER = "22023";
const PERMISSION_DENIED = "42501";
const NUMERIC_VALUE_OUT_OF_RANGE = "22003";

interface UniqueConstraintMessage {
  /** Substring of the constraint name Postgres reports for this index. */
  constraint: string;
  message: string;
}

const UNIQUE_CONSTRAINT_MESSAGES: UniqueConstraintMessage[] = [
  { constraint: "properties_org_code_unique_idx", message: "Property code already exists in this organization." },
  { constraint: "units_property_code_unique_idx", message: "Unit code already exists in this property." },
  { constraint: "owners_org_code_unique_idx", message: "Owner code already exists in this organization." },
  {
    constraint: "property_ownerships_unique_idx",
    message: "This owner already has an ownership record on this property starting on that date.",
  },
  { constraint: "tenants_org_code_unique_idx", message: "Tenant code already exists in this organization." },
  { constraint: "leases_org_code_unique_idx", message: "Lease code already exists in this organization." },
  {
    constraint: "payment_methods_org_code_unique_idx",
    message: "A payment method with this code already exists in this organization.",
  },
  { constraint: "payments_org_number_unique_idx", message: "Payment number already exists in this organization." },
  { constraint: "tenant_exits_org_reference_unique_idx", message: "That exit reference already exists — try again." },
  { constraint: "tenant_exits_active_lease_unique_idx", message: "This lease already has an exit in progress." },
  { constraint: "exit_settlements_org_reference_unique_idx", message: "That settlement reference already exists — try again." },
  { constraint: "deposit_refunds_org_reference_unique_idx", message: "That refund reference already exists — try again." },
  { constraint: "utilities_org_code_unique_idx", message: "A utility with this code already exists in this organization." },
  { constraint: "utilities_system_code_unique_idx", message: "A shared utility with this code already exists." },
  { constraint: "meters_org_code_unique_idx", message: "A meter with this code already exists in this organization." },
  { constraint: "meter_reading_batches_org_code_unique_idx", message: "A batch with this code already exists in this organization." },
  { constraint: "meter_readings_meter_date_unique_idx", message: "This meter already has a reading recorded for that date." },
];

const EXCLUSION_CONSTRAINT_MESSAGES: UniqueConstraintMessage[] = [
  {
    constraint: "utility_configurations_no_active_overlap",
    message: "An active configuration for this utility already covers an overlapping period for this property or unit.",
  },
];

/**
 * Translates a Postgres error from a properties/units/owners/property_ownerships/
 * tenants/leases/lease_parties/lease_rent_rules/lease_billing_configs/
 * utilities/utility_configurations/utility_rates/meters/meter_readings/
 * meter_reading_batches write into a plain-language message — never
 * surfaces raw constraint names, SQL, or internal detail/hint text.
 *
 * Custom `raise exception ... message => '...'` text from this schema's own
 * triggers (e.g. "Property ownership exceeds 100%") is already
 * authored as a clean, short, user-facing sentence, so those pass through
 * as-is rather than being replaced by a generic fallback.
 */
export function translateDatabaseError(error: PostgrestError): string {
  if (error.code === UNIQUE_VIOLATION) {
    // kiraya.generate_bill() raises this errcode with its own clean,
    // pre-authored text ("Bill already exists for this lease and billing
    // period.") for the bills_lease_period_unique_idx violation specifically
    // — check for a clean authored message before falling back to the
    // constraint-name lookup, which only matches raw Postgres-generated text.
    if (isCleanAuthoredMessage(error.message)) {
      return error.message;
    }
    const match = UNIQUE_CONSTRAINT_MESSAGES.find((entry) => error.message.includes(entry.constraint));
    return match?.message ?? "This record conflicts with an existing one. Check for a duplicate code.";
  }

  if (error.code === CHECK_VIOLATION) {
    if (isCleanAuthoredMessage(error.message)) {
      return error.message;
    }
    return "That value isn't allowed by the current business rules.";
  }

  if (error.code === FOREIGN_KEY_VIOLATION) {
    // kiraya.finalize_bill()/void_bill() raise this errcode with clean text
    // ("Bill does not exist.") when the row is missing or invisible under
    // RLS (not-found, not a leak) — pass it through; a raw FK-constraint
    // message still falls back to the generic sentence.
    if (isCleanAuthoredMessage(error.message)) {
      return error.message;
    }
    return "A record this depends on no longer exists. Refresh and try again.";
  }

  if (error.code === EXCLUSION_VIOLATION) {
    // kiraya.validate_lease_overlap() raises this for overlapping occupancy
    // on the same unit with its own clean, authored text. The raw Postgres-
    // generated message (utility_configurations_no_active_overlap, added in
    // P5.5B) is not pre-authored, so it needs the same constraint-name
    // lookup UNIQUE_VIOLATION already uses below.
    if (isCleanAuthoredMessage(error.message)) {
      return error.message;
    }
    const match = EXCLUSION_CONSTRAINT_MESSAGES.find((entry) => error.message.includes(entry.constraint));
    return match?.message ?? "This unit already has an overlapping lease for this period.";
  }

  if (error.code === INVALID_DATETIME) {
    // kiraya.generate_billing_run()/generate_bill() raise this for an
    // invalid billing period (end before start).
    if (isCleanAuthoredMessage(error.message)) {
      return error.message;
    }
    return "That date range isn't valid.";
  }

  if (error.code === INVALID_PARAMETER) {
    // kiraya.void_bill() raises this when no reason was supplied.
    if (isCleanAuthoredMessage(error.message)) {
      return error.message;
    }
    return "That value isn't valid.";
  }

  if (error.code === NUMERIC_VALUE_OUT_OF_RANGE) {
    // kiraya.apply_tenant_credit_to_bill()/post_credit_application_to_ledger()
    // raise this for a non-positive amount.
    if (isCleanAuthoredMessage(error.message)) {
      return error.message;
    }
    return "Enter an amount greater than zero.";
  }

  if (error.code === PERMISSION_DENIED) {
    // kiraya.void_bill()'s own explicit can_write_organization() check
    // raises this with clean text; a raw RLS policy-violation message
    // (quotes a table name) falls back to the generic sentence.
    if (isCleanAuthoredMessage(error.message)) {
      return error.message;
    }
    return "You don't have permission to perform this action.";
  }

  return "Something went wrong saving this. Please try again.";
}

/** Heuristic: short, no quotes/underscores/SQL-looking tokens — matches this schema's hand-authored trigger messages. */
function isCleanAuthoredMessage(message: string): boolean {
  return (
    message.length > 0 &&
    message.length < 120 &&
    !message.includes('"') &&
    !message.includes("_") &&
    !/\bconstraint\b|\bcolumn\b|\brelation\b/i.test(message)
  );
}
