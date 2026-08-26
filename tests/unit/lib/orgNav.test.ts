import { describe, expect, it } from "vitest";
import { orgNavGroups } from "@/lib/navigation/orgNav";

describe("orgNavGroups — P6.3-E: Lease navigation removed", () => {
  it("has no nav item pointing at /app/leases anywhere in the sidebar", () => {
    const allItems = orgNavGroups.flatMap((group) => group.items);

    expect(allItems.some((item) => item.href === "/app/leases" || item.href.startsWith("/app/leases/"))).toBe(false);
  });

  it("has no nav item labeled Leases", () => {
    const allItems = orgNavGroups.flatMap((group) => group.items);

    expect(allItems.some((item) => item.label === "Leases")).toBe(false);
  });

  it("still has the Tenants nav item in the People group (the replacement entry point)", () => {
    const peopleGroup = orgNavGroups.find((group) => group.label === "People");

    expect(peopleGroup?.items.some((item) => item.href === "/app/tenants")).toBe(true);
  });
});
