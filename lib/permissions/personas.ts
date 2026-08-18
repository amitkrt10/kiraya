/**
 * Best-effort mapping from the approved design's UX personas
 * (Kiraya Handoff Spec, Section C — Viewer / Operational / Manager /
 * Accountant / Org Admin / Platform Admin) to the `kiraya.roles.code`
 * values actually referenced by the backend's RLS helper functions.
 *
 * IMPORTANT — P5.2A finding: `kiraya.roles` has no seed data anywhere in
 * the migration tree, and only `SUPER_ADMIN`, `CLIENT_ADMIN`, and
 * `ORG_ADMIN` are ever referenced by code (in
 * supabase/migrations/20260813000239_kiraya_security_rls_helpers.sql).
 * There is no backend role code for Viewer, Operational, Manager, or
 * Accountant today. Do not hardcode UI gating against those names — this
 * mapping exists only to render a human-readable label next to whatever
 * role codes are actually present, and it degrades to "Member" for
 * anything it doesn't recognize.
 */

export const PLATFORM_ADMIN_ROLE_CODE = "SUPER_ADMIN";
export const ORG_ADMIN_ROLE_CODES = ["CLIENT_ADMIN", "ORG_ADMIN"];

const KNOWN_PERSONA_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Platform Admin",
  CLIENT_ADMIN: "Org Admin",
  ORG_ADMIN: "Org Admin",
};

/**
 * Given the role codes resolved for a profile within one organization
 * (see lib/permissions/resolve.ts), returns the best available display
 * label. Falls back to "Member" — never invents a persona the backend
 * hasn't actually assigned.
 */
export function personaLabelForRoleCodes(roleCodes: string[]): string {
  for (const code of roleCodes) {
    const label = KNOWN_PERSONA_LABELS[code];
    if (label) return label;
  }
  return roleCodes[0] ?? "Member";
}
