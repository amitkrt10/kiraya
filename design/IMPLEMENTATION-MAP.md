# Design → Route Implementation Map

Maps each approved design file under `design/` to its Next.js route(s). "Status"
reflects the state after **P5.2A (Application Foundation)** — see
`supabase/migrations` for the backend and the P5.2A completion report for the
full rundown of what shipped in this phase.

| Design file | Route(s) | P5.2A status |
|---|---|---|
| `Kiraya Handoff Spec.dc.html` | — (spec, not a screen) | Consumed for design tokens, nav structure, role/permission matrix, and screen inventory |
| `Org Dashboard.dc.html` | `/app/dashboard` | App shell (light sidebar + topbar) built and reused; dashboard body is a placeholder — KPI strip / collection chart / recent payments wiring against `kiraya.v_organization_dashboard` is a later phase |
| `Platform Admin Dashboard.dc.html` | `/admin/dashboard` | Admin shell (dark sidebar) built and reused; dashboard body is a placeholder — wiring against `kiraya.v_platform_dashboard` is a later phase |
| `Tenant Detail.dc.html` | `/app/tenants/[id]` | Not yet built — `/app/tenants` list is a placeholder in P5.2A; detail route arrives with the Tenants phase |
| `Property Detail.dc.html` | `/app/properties/[id]` | Not yet built — `/app/properties` list is a placeholder in P5.2A; detail route arrives with the Properties phase |
| `Bill Detail.dc.html` | `/app/billing/bills/[id]` | Not yet built — `/app/billing` is a placeholder in P5.2A; detail route arrives with the Billing phase |

## Spec-only screens (no `.dc.html` built yet)

These are described in Section G/H of the handoff spec but have no built HTML reference. P5.2A gives each a placeholder route using the shared shell + navigation; the actual screen designs and data wiring are later phases, in the order given by the spec's Section M ("Recommended Implementation Order").

| Route | Spec section |
|---|---|
| `/app/units` | G — Units list |
| `/app/owners` | G — Owners list |
| `/app/leases` | G — Leases list |
| `/app/billing` | G — Billing Dashboard & Runs |
| `/app/payments` | G — Payments |
| `/app/ledger` | G — Ledger |
| `/app/deposits` | G — Security Deposits |
| `/app/exits` | H — Tenant Exit (9-step guided workflow) |
| `/app/utilities` | G — Utilities & Meters |
| `/app/meters` | G — Utilities & Meters (meter detail/consumption) |
| `/app/documents` | G — Documents |
| `/app/imports` | G — Imports |
| `/app/reports` | G — Reports (Reporting Center + 12 reports) |
| `/app/settings` | G — Administration (Org Settings; Members/Roles deferred beyond this route) |
| `/admin/organizations` | G — Platform Organizations |

## Not yet routed

Per the spec but out of P5.2A's route list (Section 23) and not yet given a URL: Members list/detail, Roles & Permissions, Platform Reports, Support & Ops, Platform Settings. These will get routes (and admin nav entries — see `lib/navigation/adminNav.ts`) alongside the phase that implements them.
