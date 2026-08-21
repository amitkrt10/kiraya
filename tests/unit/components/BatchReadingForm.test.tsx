import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BatchReadingForm } from "@/components/meters/BatchReadingForm";
import type { MeterForBatchItem } from "@/lib/queries/meters";

const submitBatchReadingsActionMock = vi.fn();
vi.mock("@/lib/actions/meterReadings", () => ({
  submitBatchReadingsAction: (...args: unknown[]) => submitBatchReadingsActionMock(...args),
}));

function makeMeter(overrides: Partial<MeterForBatchItem>): MeterForBatchItem {
  return {
    id: "meter-1",
    meter_code: "MTR-ELEC-014",
    utility_id: "util-1",
    utilities: { name: "Electricity" },
    units: { unit_code: "A-101" },
    latest_reading: { reading_value: 145, reading_date: "2026-05-31" },
    ...overrides,
  };
}

describe("BatchReadingForm — per-row status", () => {
  it("shows Missing for a row with no reading entered yet, and nothing for one being typed", async () => {
    render(<BatchReadingForm propertyId="prop-1" readingDate="2026-06-30" meters={[makeMeter({})]} />);

    expect(screen.getByText("Missing")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Reading for MTR-ELEC-014"), "190");
    expect(screen.queryByText("Missing")).not.toBeInTheDocument();
  });

  it("shows Saved for a row the backend accepted, and Error (with the message) for one it rejected — independently, in a single submission", async () => {
    submitBatchReadingsActionMock.mockResolvedValue({
      results: [
        { meterId: "meter-1", status: "saved" },
        { meterId: "meter-2", status: "error", error: "Meter reading cannot be lower than the previous reading." },
      ],
    });

    const meters = [
      makeMeter({ id: "meter-1", meter_code: "MTR-ELEC-014" }),
      makeMeter({ id: "meter-2", meter_code: "MTR-GAS-003", latest_reading: { reading_value: 100, reading_date: "2026-05-31" } }),
    ];
    render(<BatchReadingForm propertyId="prop-1" readingDate="2026-06-30" meters={meters} />);

    await userEvent.type(screen.getByLabelText("Reading for MTR-ELEC-014"), "190");
    await userEvent.type(screen.getByLabelText("Reading for MTR-GAS-003"), "95");
    await userEvent.click(screen.getByRole("button", { name: "Save Readings" }));

    await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument());
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Meter reading cannot be lower than the previous reading.")).toBeInTheDocument();
    expect(screen.getByText(/1 saved/)).toBeInTheDocument();
    expect(screen.getByText(/1 error/)).toBeInTheDocument();
  });

  it("disables the input for a row already saved, so it cannot be resubmitted", async () => {
    submitBatchReadingsActionMock.mockResolvedValue({ results: [{ meterId: "meter-1", status: "saved" }] });

    render(<BatchReadingForm propertyId="prop-1" readingDate="2026-06-30" meters={[makeMeter({})]} />);
    await userEvent.type(screen.getByLabelText("Reading for MTR-ELEC-014"), "190");
    await userEvent.click(screen.getByRole("button", { name: "Save Readings" }));

    await waitFor(() => expect(screen.getByLabelText("Reading for MTR-ELEC-014")).toBeDisabled());
  });
});
