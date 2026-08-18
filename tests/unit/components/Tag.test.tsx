import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Check } from "lucide-react";
import { Tag } from "@/components/ui/Tag";

describe("Tag", () => {
  it("renders the label text alongside the icon (status is never color alone)", () => {
    render(
      <Tag variant="neutral" icon={Check}>
        Paid
      </Tag>,
    );

    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("applies the tag-outline class for the outline variant", () => {
    render(
      <Tag variant="outline" icon={Check}>
        Outstanding
      </Tag>,
    );

    expect(screen.getByText("Outstanding").closest("span")).toHaveClass("tag-outline");
  });
});
