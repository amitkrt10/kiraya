import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Dialog } from "@/components/ui/Dialog";
import { Drawer } from "@/components/ui/Drawer";

describe("Dialog/Drawer accessible naming with multiple simultaneous instances", () => {
  it("gives each Dialog instance a distinct title id instead of a shared hardcoded one", () => {
    const { container } = render(
      <>
        <Dialog open={false} onClose={() => {}} title="First Dialog">
          content
        </Dialog>
        <Dialog open={false} onClose={() => {}} title="Second Dialog">
          content
        </Dialog>
      </>,
    );

    const headings = Array.from(container.querySelectorAll("h2"));
    expect(headings).toHaveLength(2);
    const ids = headings.map((heading) => heading.id);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every((id) => id.length > 0)).toBe(true);

    // Each dialog's aria-labelledby must point at its own heading, not a shared id.
    const dialogs = Array.from(container.querySelectorAll("dialog"));
    dialogs.forEach((dialog, index) => {
      expect(dialog.getAttribute("aria-labelledby")).toBe(ids[index]);
    });
  });

  it("gives each Drawer instance a distinct title id instead of a shared hardcoded one", () => {
    const { container } = render(
      <>
        <Drawer open={false} onClose={() => {}} title="First Drawer">
          content
        </Drawer>
        <Drawer open={false} onClose={() => {}} title="Second Drawer">
          content
        </Drawer>
      </>,
    );

    const headings = Array.from(container.querySelectorAll("h2"));
    expect(headings).toHaveLength(2);
    const ids = headings.map((heading) => heading.id);
    expect(new Set(ids).size).toBe(2);
  });
});
