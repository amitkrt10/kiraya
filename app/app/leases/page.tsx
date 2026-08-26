import { redirect } from "next/navigation";

/**
 * P6.3-E: retired from normal navigation — the sidebar no longer links
 * here, and Tenant Detail's "Occupancy History" tab plus Property Detail's
 * Units tab together cover what this list showed. Redirects rather than
 * 404s so any stale bookmark/link still lands somewhere useful. The
 * underlying kiraya.leases table and this route's components
 * (LeaseTable/LeaseFilters) are untouched — only this page's own content
 * changed.
 */
export default function LeasesPage() {
  redirect("/app/tenants");
}
