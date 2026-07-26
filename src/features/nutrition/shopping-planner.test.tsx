import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TrackingProvider } from "@/features/tracking/tracking-provider";
import { ShoppingPlanner } from "./shopping-planner";

describe("shopping planner", () => {
  beforeEach(() => localStorage.clear());

  it("shows whole shop quantities and updates from the day counters", async () => {
    const user = userEvent.setup();
    render(
      <TrackingProvider>
        <ShoppingPlanner />
      </TrackingProvider>
    );

    const fage = screen
      .getByRole("checkbox", { name: /check off fage/i })
      .closest("article");
    expect(fage).not.toBeNull();
    expect(within(fage!).getByText("4")).toBeInTheDocument();
    expect(within(fage!).getByText("tubs")).toBeInTheDocument();
    expect(within(fage!).getByText("£23.60")).toBeInTheDocument();
    expect(fage!.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("groceries.morrisons.com/images-v3/")
    );
    expect(
      screen.getByText("Estimated Morrisons total")
    ).toBeInTheDocument();

    const climbing = screen.getByRole("spinbutton", {
      name: "Climbing · Tofu days"
    });
    const rest = screen.getByRole("spinbutton", {
      name: "Rest · Tofu days"
    });
    await user.clear(climbing);
    await user.type(climbing, "1");
    await user.clear(rest);
    await user.type(rest, "0");

    const updatedFage = screen
      .getByRole("checkbox", { name: /check off fage/i })
      .closest("article");
    expect(within(updatedFage!).getByText("1")).toBeInTheDocument();
    expect(within(updatedFage!).getByText("tub")).toBeInTheDocument();
  });

  it("lets a shopper check off an item", async () => {
    const user = userEvent.setup();
    render(
      <TrackingProvider>
        <ShoppingPlanner />
      </TrackingProvider>
    );
    const checkbox = screen.getByRole("checkbox", {
      name: /check off fage/i
    });
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });
});
