import { describe, expect, it } from "vitest";
import { tenantFormSchema, TENANT_TYPES, TENANT_RELIGIONS } from "@/lib/validation/tenant";

const validInput = {
  displayName: "Asha Rao",
  dateOfBirth: "",
  religion: "",
  memberCount: "",
  tenantType: "INDIVIDUAL",
  status: "ACTIVE",
  legalName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  aadhaarNumber: "",
  panNumber: "",
  otherIdentityDocumentNumber: "",
  companyRegistrationNumber: "",
  addressLine1: "",
  addressLine2: "",
  locality: "",
  city: "",
  state: "",
  postalCode: "",
  countryCode: "in",
  emergencyContact1Name: "",
  emergencyContact1Phone: "",
  emergencyContact1Address: "",
  emergencyContact2Name: "",
  emergencyContact2Phone: "",
  emergencyContact2Address: "",
  localReference1Name: "",
  localReference1Phone: "",
  localReference1Address: "",
  localReference2Name: "",
  localReference2Phone: "",
  localReference2Address: "",
  notes: "",
};

describe("tenantFormSchema", () => {
  it("accepts a minimal valid tenant (every optional field blank) and uppercases the country code", () => {
    const result = tenantFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryCode).toBe("IN");
      expect(result.data.phone).toBeUndefined();
    }
  });

  it("has no tenantCode field at all — P6.2-D2 generates it server-side, the form never supplies it", () => {
    expect("tenantCode" in tenantFormSchema.shape).toBe(false);
  });

  it("rejects an empty display name", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, displayName: "" });
    expect(result.success).toBe(false);
  });

  describe("tenant type — all six options", () => {
    it("TENANT_TYPES has exactly the six required values, in order", () => {
      expect(TENANT_TYPES).toEqual(["INDIVIDUAL", "COMPANY", "OTHER", "SCHOOL", "INSTITUTE", "FAMILY"]);
    });

    it.each(TENANT_TYPES)("accepts tenantType=%s", (tenantType) => {
      const result = tenantFormSchema.safeParse({ ...validInput, tenantType });
      expect(result.success).toBe(true);
    });

    it("rejects a tenant type outside the six options", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, tenantType: "LANDLORD" });
      expect(result.success).toBe(false);
    });
  });

  it("rejects an invalid email", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid email and blank optional fields as undefined", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, email: "asha@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("asha@example.com");
    }
  });

  it("treats a null field (zero-option select) the same as an empty string", () => {
    const result = tenantFormSchema.safeParse({ ...validInput, phone: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
    }
  });

  describe("religion — fixed dropdown, not free text", () => {
    it("TENANT_RELIGIONS has exactly the ten required values, in order", () => {
      expect(TENANT_RELIGIONS).toEqual([
        "HINDU",
        "MUSLIM",
        "CHRISTIAN",
        "SIKH",
        "BUDDHIST",
        "JAIN",
        "PARSI_ZOROASTRIAN",
        "JEWISH",
        "OTHER",
        "PREFER_NOT_TO_SAY",
      ]);
    });

    it("is optional — blank is accepted", () => {
      const result = tenantFormSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.religion).toBeUndefined();
      }
    });

    it.each(TENANT_RELIGIONS)("accepts religion=%s", (religion) => {
      const result = tenantFormSchema.safeParse({ ...validInput, religion });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.religion).toBe(religion);
      }
    });

    it("rejects free text that isn't one of the fixed options", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, religion: "Hindu" });
      expect(result.success).toBe(false);
    });

    it("rejects an arbitrary string outside the ten options", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, religion: "Atheist" });
      expect(result.success).toBe(false);
    });
  });

  describe("memberCount — optional, integer >= 1", () => {
    it("is optional — blank is accepted", () => {
      const result = tenantFormSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.memberCount).toBeUndefined();
      }
    });

    it("accepts a positive integer", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, memberCount: "4" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.memberCount).toBe(4);
      }
    });

    it("accepts exactly 1 (the minimum)", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, memberCount: "1" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.memberCount).toBe(1);
      }
    });

    it("rejects 0", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, memberCount: "0" });
      expect(result.success).toBe(false);
    });

    it("rejects a negative number", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, memberCount: "-3" });
      expect(result.success).toBe(false);
    });

    it("rejects a decimal", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, memberCount: "2.5" });
      expect(result.success).toBe(false);
    });

    it("rejects a non-numeric value", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, memberCount: "abc" });
      expect(result.success).toBe(false);
    });
  });

  describe("identity documents — Aadhaar/PAN/Other, all optional, no format validation", () => {
    it("accepts all three blank", () => {
      const result = tenantFormSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.aadhaarNumber).toBeUndefined();
        expect(result.data.panNumber).toBeUndefined();
        expect(result.data.otherIdentityDocumentNumber).toBeUndefined();
      }
    });

    it("accepts any string for aadhaarNumber, panNumber, and otherIdentityDocumentNumber — no strict format check", () => {
      const result = tenantFormSchema.safeParse({
        ...validInput,
        aadhaarNumber: "not-a-real-aadhaar-format",
        panNumber: "not-a-real-pan-format",
        otherIdentityDocumentNumber: "anything at all",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.aadhaarNumber).toBe("not-a-real-aadhaar-format");
        expect(result.data.panNumber).toBe("not-a-real-pan-format");
        expect(result.data.otherIdentityDocumentNumber).toBe("anything at all");
      }
    });
  });

  describe("two emergency contacts, two local references — all fields optional", () => {
    it("accepts all 4 slots entirely blank", () => {
      const result = tenantFormSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("accepts Emergency Contact 1 filled while Emergency Contact 2 stays blank", () => {
      const result = tenantFormSchema.safeParse({
        ...validInput,
        emergencyContact1Name: "Ravi Kumar",
        emergencyContact1Phone: "+91 90000 11111",
        emergencyContact1Address: "12 MG Road, Bengaluru",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emergencyContact1Name).toBe("Ravi Kumar");
        expect(result.data.emergencyContact2Name).toBeUndefined();
      }
    });

    it("accepts both emergency contacts and both local references filled independently", () => {
      const result = tenantFormSchema.safeParse({
        ...validInput,
        emergencyContact1Name: "Contact One",
        emergencyContact2Name: "Contact Two",
        localReference1Name: "Reference One",
        localReference2Name: "Reference Two",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emergencyContact1Name).toBe("Contact One");
        expect(result.data.emergencyContact2Name).toBe("Contact Two");
        expect(result.data.localReference1Name).toBe("Reference One");
        expect(result.data.localReference2Name).toBe("Reference Two");
      }
    });

    it("accepts a partially-filled contact (only phone, no name/address)", () => {
      const result = tenantFormSchema.safeParse({ ...validInput, localReference1Phone: "+91 90000 22222" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.localReference1Phone).toBe("+91 90000 22222");
        expect(result.data.localReference1Name).toBeUndefined();
        expect(result.data.localReference1Address).toBeUndefined();
      }
    });
  });

  it("notes is optional", () => {
    const blank = tenantFormSchema.safeParse(validInput);
    expect(blank.success).toBe(true);
    if (blank.success) {
      expect(blank.data.notes).toBeUndefined();
    }

    const filled = tenantFormSchema.safeParse({ ...validInput, notes: "Prefers WhatsApp over calls." });
    expect(filled.success).toBe(true);
    if (filled.success) {
      expect(filled.data.notes).toBe("Prefers WhatsApp over calls.");
    }
  });
});
