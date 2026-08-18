import { z } from "zod";

/**
 * Empty-string OR entirely-absent form fields become `undefined` (→ NULL in
 * the database) instead of failing validation. A <select> with zero
 * selectable options (e.g. an empty property-type catalog — see
 * lib/queries/propertyTypes.ts) is omitted from FormData as `null` by the
 * browser, not `""`, so both must be treated as "not provided."
 */
export const optionalTrimmedString = (maxLength?: number) => {
  const base = maxLength ? z.string().trim().max(maxLength) : z.string().trim();
  return z.preprocess(
    (val) => (val === null || val === undefined || (typeof val === "string" && val.trim() === "") ? undefined : val),
    base.optional(),
  );
};

/** Empty-string numeric form fields become `undefined`; non-empty values are coerced and constrained. */
export const optionalCoercedNumber = (build: (schema: z.ZodNumber) => z.ZodNumber) =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    build(z.coerce.number()).optional(),
  );

export const requiredTrimmedString = (label: string, maxLength?: number) => {
  const base = z.string().trim().min(1, { error: `${label} is required.` });
  return maxLength ? base.max(maxLength) : base;
};

export const countryCodeSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z]{2}$/, { error: "Use a 2-letter country code, e.g. IN." })
  .transform((value) => value.toUpperCase());
