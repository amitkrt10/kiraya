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
