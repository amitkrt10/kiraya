import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PermissionDenied } from "@/components/ui/ErrorState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No properties yet" description="Add your first property to get started." />);

    expect(screen.getByText("No properties yet")).toBeInTheDocument();
    expect(screen.getByText("Add your first property to get started.")).toBeInTheDocument();
  });
});

describe("PermissionDenied", () => {
  it("renders a static explanatory message, not a silent failure", () => {
    render(<PermissionDenied />);

    expect(screen.getByText("You don't have access to this area")).toBeInTheDocument();
  });
});
