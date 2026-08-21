import Link from "next/link";

/** /app/utilities and /app/meters share one section — orgNavGroups only lists /app/utilities as a top-level item, so Meters is reached from here, matching the approved design's two-tab sub-nav rather than inventing new top-level navigation. */
export function UtilitiesSubNav({ active }: { active: "utilities" | "meters" }) {
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: isActive ? 700 : 600,
    color: isActive ? "var(--color-text)" : "var(--color-neutral-700)",
    borderBottom: isActive ? "2px solid var(--color-text)" : "2px solid transparent",
  });

  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "2px solid var(--color-divider)", marginBottom: 20 }}>
      <Link href="/app/utilities" style={tabStyle(active === "utilities")}>
        Utilities
      </Link>
      <Link href="/app/meters" style={tabStyle(active === "meters")}>
        Meters
      </Link>
    </div>
  );
}
