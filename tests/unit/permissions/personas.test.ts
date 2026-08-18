import { describe, expect, it } from "vitest";
import { personaLabelForRoleCodes } from "@/lib/permissions/personas";

describe("personaLabelForRoleCodes", () => {
  it("labels SUPER_ADMIN as Platform Admin", () => {
    expect(personaLabelForRoleCodes(["SUPER_ADMIN"])).toBe("Platform Admin");
  });

  it("labels ORG_ADMIN and CLIENT_ADMIN as Org Admin", () => {
    expect(personaLabelForRoleCodes(["ORG_ADMIN"])).toBe("Org Admin");
    expect(personaLabelForRoleCodes(["CLIENT_ADMIN"])).toBe("Org Admin");
  });

  it("falls back to the raw code for unrecognized roles instead of inventing a persona", () => {
    expect(personaLabelForRoleCodes(["SOME_FUTURE_ROLE"])).toBe("SOME_FUTURE_ROLE");
  });

  it("falls back to Member when there are no role codes at all", () => {
    expect(personaLabelForRoleCodes([])).toBe("Member");
  });
});
