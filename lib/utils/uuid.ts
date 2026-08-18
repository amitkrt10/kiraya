const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A malformed route param (e.g. someone hand-editing the URL) should 404, not crash a `uuid` column comparison in Postgres. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
