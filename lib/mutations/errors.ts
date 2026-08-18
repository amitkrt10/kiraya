import type { PostgrestError } from "@supabase/supabase-js";

export type MutationResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
const FOREIGN_KEY_VIOLATION = "23503";

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
];

/**
 * Translates a Postgres error from a properties/units/owners/property_ownerships
 * write into a plain-language message — never surfaces raw constraint names,
 * SQL, or internal detail/hint text (task instruction #31/#36).
 *
 * Custom `raise exception ... message => '...'` text from this schema's own
 * triggers (e.g. "Property ownership exceeds 100%") is already
 * authored as a clean, short, user-facing sentence, so those pass through
 * as-is rather than being replaced by a generic fallback.
 */
export function translateDatabaseError(error: PostgrestError): string {
  if (error.code === UNIQUE_VIOLATION) {
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
    return "A record this depends on no longer exists. Refresh and try again.";
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
