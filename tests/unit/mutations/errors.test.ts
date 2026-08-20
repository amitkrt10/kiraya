import { describe, expect, it } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { translateDatabaseError } from "@/lib/mutations/errors";

function fakeError(overrides: Partial<PostgrestError>): PostgrestError {
  const error: PostgrestError = {
    message: "",
    details: "",
    hint: "",
    code: "",
    name: "PostgrestError",
    toJSON() {
      return { name: error.name, message: error.message, details: error.details, hint: error.hint, code: error.code };
    },
    ...overrides,
  };
  return error;
}

describe("translateDatabaseError", () => {
  it("translates a duplicate property code into a plain-language message", () => {
    const error = fakeError({
      code: "23505",
      message:
        'duplicate key value violates unique constraint "properties_org_code_unique_idx"',
    });
    expect(translateDatabaseError(error)).toBe("Property code already exists in this organization.");
  });

  it("translates a duplicate unit code into a plain-language message", () => {
    const error = fakeError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "units_property_code_unique_idx"',
    });
    expect(translateDatabaseError(error)).toBe("Unit code already exists in this property.");
  });

  it("translates a duplicate tenant code into a plain-language message", () => {
    const error = fakeError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "tenants_org_code_unique_idx"',
    });
    expect(translateDatabaseError(error)).toBe("Tenant code already exists in this organization.");
  });

  it("translates a duplicate lease code into a plain-language message", () => {
    const error = fakeError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "leases_org_code_unique_idx"',
    });
    expect(translateDatabaseError(error)).toBe("Lease code already exists in this organization.");
  });

  it("falls back to a generic duplicate message for an unrecognized unique constraint", () => {
    const error = fakeError({ code: "23505", message: 'duplicate key value violates unique constraint "some_other_idx"' });
    expect(translateDatabaseError(error)).toContain("duplicate");
  });

  it("passes through a clean, short authored trigger message for check violations", () => {
    const error = fakeError({ code: "23514", message: "Property ownership exceeds 100%" });
    expect(translateDatabaseError(error)).toBe("Property ownership exceeds 100%");
  });

  it("does not leak raw constraint-name-shaped check violation messages", () => {
    const error = fakeError({
      code: "23514",
      message: 'new row for relation "properties" violates check constraint "properties_latitude_check"',
    });
    const translated = translateDatabaseError(error);
    expect(translated).not.toContain("relation");
    expect(translated).not.toContain('"');
  });

  it("gives a generic message for foreign key violations", () => {
    const error = fakeError({ code: "23503", message: "insert or update on table violates foreign key constraint" });
    expect(translateDatabaseError(error)).not.toContain("foreign key");
  });

  it("never surfaces a raw/unknown error code's message", () => {
    const error = fakeError({ code: "XX000", message: "internal server error, stack trace: ..." });
    expect(translateDatabaseError(error)).toBe("Something went wrong saving this. Please try again.");
  });

  it("translates a duplicate payment method code into a plain-language message", () => {
    const error = fakeError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "payment_methods_org_code_unique_idx"',
    });
    expect(translateDatabaseError(error)).toBe("A payment method with this code already exists in this organization.");
  });

  it("translates a duplicate payment number into a plain-language message", () => {
    const error = fakeError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "payments_org_number_unique_idx"',
    });
    expect(translateDatabaseError(error)).toBe("Payment number already exists in this organization.");
  });

  it("passes through kiraya.reverse_payment()'s clean 'already reversed' message", () => {
    const error = fakeError({ code: "23514", message: "Payment has already been reversed." });
    expect(translateDatabaseError(error)).toBe("Payment has already been reversed.");
  });

  it("passes through the missing-reversal-reason message (22023)", () => {
    const error = fakeError({ code: "22023", message: "A reason is required to reverse a payment." });
    expect(translateDatabaseError(error)).toBe("A reason is required to reverse a payment.");
  });

  it("passes through kiraya.post_payment_reversal_ledger_entry()'s explicit permission message for 42501", () => {
    const error = fakeError({ code: "42501", message: "Not authorized to reverse payments in this organization." });
    expect(translateDatabaseError(error)).toBe("Not authorized to reverse payments in this organization.");
  });

  it("passes through kiraya.generate_bill()'s authored duplicate-bill message for a unique violation", () => {
    const error = fakeError({ code: "23505", message: "Bill already exists for this lease and billing period." });
    expect(translateDatabaseError(error)).toBe("Bill already exists for this lease and billing period.");
  });

  it("still falls back to the constraint-name lookup for a raw unique-violation message", () => {
    const error = fakeError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "leases_org_code_unique_idx"',
    });
    expect(translateDatabaseError(error)).toBe("Lease code already exists in this organization.");
  });

  it("passes through kiraya.finalize_bill()/void_bill()'s clean not-found message for a foreign key violation", () => {
    const error = fakeError({ code: "23503", message: "Bill does not exist." });
    expect(translateDatabaseError(error)).toBe("Bill does not exist.");
  });

  it("falls back to the generic message for a raw foreign-key violation", () => {
    const error = fakeError({ code: "23503", message: "insert or update on table violates foreign key constraint" });
    expect(translateDatabaseError(error)).toBe("A record this depends on no longer exists. Refresh and try again.");
  });

  it("translates an invalid billing period (22007) into a plain message", () => {
    const error = fakeError({ code: "22007", message: "Billing period end date cannot be before start date." });
    expect(translateDatabaseError(error)).toBe("Billing period end date cannot be before start date.");
  });

  it("translates a missing void reason (22023) into a plain message", () => {
    const error = fakeError({ code: "22023", message: "A reason is required to void a bill." });
    expect(translateDatabaseError(error)).toBe("A reason is required to void a bill.");
  });

  it("passes through void_bill()'s explicit permission message for 42501", () => {
    const error = fakeError({ code: "42501", message: "Not authorized to void bills in this organization." });
    expect(translateDatabaseError(error)).toBe("Not authorized to void bills in this organization.");
  });

  it("falls back to a generic permission message for a raw RLS policy violation (42501)", () => {
    const error = fakeError({ code: "42501", message: 'new row violates row-level security policy for table "bills"' });
    expect(translateDatabaseError(error)).toBe("You don't have permission to perform this action.");
  });

  it("passes through post_credit_application_to_ledger()'s explicit permission message for 42501", () => {
    const error = fakeError({ code: "42501", message: "Not authorized to apply credit in this organization." });
    expect(translateDatabaseError(error)).toBe("Not authorized to apply credit in this organization.");
  });

  it("passes through apply_tenant_credit_to_bill()'s ineligible-status message for 23514", () => {
    const error = fakeError({ code: "23514", message: "Credit cannot be applied to this bill status." });
    expect(translateDatabaseError(error)).toBe("Credit cannot be applied to this bill status.");
  });

  it("passes through apply_tenant_credit_to_bill()'s insufficient-credit message for 23514", () => {
    const error = fakeError({ code: "23514", message: "No tenant credit is available to apply." });
    expect(translateDatabaseError(error)).toBe("No tenant credit is available to apply.");
  });

  it("translates a non-positive credit application amount (22003) into a plain-language message", () => {
    const error = fakeError({ code: "22003", message: 'numeric field overflow for column "p_amount"' });
    expect(translateDatabaseError(error)).toBe("Enter an amount greater than zero.");
  });

  it("passes through a clean authored 22003 message when the RPC's own text is already clean", () => {
    const error = fakeError({ code: "22003", message: "Credit application amount must be greater than zero." });
    expect(translateDatabaseError(error)).toBe("Credit application amount must be greater than zero.");
  });

  it("passes through a clean, short authored overlap-trigger message for exclusion violations", () => {
    const error = fakeError({ code: "23P01", message: "This unit is already leased for the selected dates" });
    expect(translateDatabaseError(error)).toBe("This unit is already leased for the selected dates");
  });

  it("falls back to a generic overlap message when the exclusion violation text isn't clean", () => {
    const error = fakeError({
      code: "23P01",
      message: 'conflicting key value violates exclusion constraint "leases_no_overlap_excl"',
    });
    expect(translateDatabaseError(error)).toBe("This unit already has an overlapping lease for this period.");
  });
});
