import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyStatusTag } from "@/components/properties/PropertyStatusTag";
import { UnitStatusTag } from "@/components/units/UnitStatusTag";
import { TenantStatusTag } from "@/components/tenants/TenantStatusTag";
import { LeaseStatusTag } from "@/components/leases/LeaseStatusTag";
import { BillStatusTag } from "@/components/billing/BillStatusTag";
import { BillingRunStatusTag } from "@/components/billing/BillingRunStatusTag";
import { PaymentStatusTag } from "@/components/payments/PaymentStatusTag";
import { DepositStatusTag } from "@/components/securityDeposits/DepositStatusTag";
import { DepositTransactionTypeTag } from "@/components/securityDeposits/DepositTransactionTypeTag";

describe("PropertyStatusTag", () => {
  it.each([
    ["ACTIVE", "Active"],
    ["INACTIVE", "Inactive"],
    ["ARCHIVED", "Archived"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<PropertyStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("UnitStatusTag", () => {
  it.each([
    ["VACANT", "Vacant"],
    ["OCCUPIED", "Occupied"],
    ["MAINTENANCE", "Maintenance"],
    ["UNAVAILABLE", "Unavailable"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<UnitStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("TenantStatusTag", () => {
  it.each([
    ["ACTIVE", "Active"],
    ["INACTIVE", "Inactive"],
    ["ARCHIVED", "Archived"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<TenantStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("LeaseStatusTag", () => {
  it.each([
    ["DRAFT", "Draft"],
    ["ACTIVE", "Active"],
    ["ENDED", "Ended"],
    ["CANCELLED", "Cancelled"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<LeaseStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("BillStatusTag", () => {
  it.each([
    ["DRAFT", "Draft"],
    ["FINALIZED", "Finalized"],
    ["PARTIALLY_PAID", "Partially Paid"],
    ["PAID", "Paid"],
    ["VOID", "Void"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<BillStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("BillingRunStatusTag", () => {
  it.each([
    ["DRAFT", "Draft"],
    ["RUNNING", "Running"],
    ["COMPLETED", "Completed"],
    ["PARTIAL", "Partial"],
    ["FAILED", "Failed"],
    ["FINALIZED", "Finalized"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<BillingRunStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("PaymentStatusTag", () => {
  it.each([
    ["POSTED", "Posted"],
    ["REVERSED", "Reversed"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<PaymentStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("DepositStatusTag", () => {
  it.each([
    ["PENDING", "Pending"],
    ["PARTIALLY_RECEIVED", "Partially Received"],
    ["RECEIVED", "Received"],
  ] as const)("renders the %s status as %s", (status, label) => {
    render(<DepositStatusTag status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("DepositTransactionTypeTag", () => {
  it.each([
    ["RECEIPT", "Receipt"],
    ["DEDUCTION", "Deduction"],
    ["REFUND", "Refund"],
    ["ADJUSTMENT", "Adjustment"],
  ] as const)("renders the %s type as %s", (type, label) => {
    render(<DepositTransactionTypeTag type={type} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
