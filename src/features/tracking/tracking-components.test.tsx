import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TodayPage } from "./today-page";
import { SettingsPage } from "./settings-page";
import { TrackingProvider } from "./tracking-provider";
import { STORAGE_KEY } from "./storage";

function renderWithProvider(node: React.ReactNode) {
  return render(<TrackingProvider>{node}</TrackingProvider>);
}

describe("tracking interactions", () => {
  beforeEach(() => localStorage.clear());

  it("completes and undoes a meal", async () => {
    const user = userEvent.setup();
    renderWithProvider(<TodayPage />);
    const checkbox = await screen.findByRole("checkbox", {
      name: /mark complete: fage, granola and banana/i
    });
    const calorieBar = screen.getByRole("progressbar", {
      name: /calories eaten/i
    });
    expect(calorieBar).toHaveAccessibleName(/calories eaten: 0 of/i);
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(calorieBar).toHaveAccessibleName(/calories eaten: 501 of/i);
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    expect(calorieBar).toHaveAccessibleName(/calories eaten: 0 of/i);
  });

  it("opens meal details when the meal row is tapped", async () => {
    const user = userEvent.setup();
    renderWithProvider(<TodayPage />);
    const heading = await screen.findByRole("heading", {
      name: /fage, granola and banana/i
    });
    const checkbox = screen.getByRole("checkbox", {
      name: /mark complete: fage, granola and banana/i
    });

    await user.click(heading);
    expect(screen.getByText("Meal total")).toBeInTheDocument();
    expect(checkbox).toHaveAttribute("aria-checked", "false");

    await user.click(heading);
    expect(screen.queryByText("Meal total")).not.toBeInTheDocument();
  });

  it("switches plan and variant and quick-adds water", async () => {
    const user = userEvent.setup();
    renderWithProvider(<TodayPage />);
    await screen.findByRole("heading", { name: /climbing fuel/i });
    expect(
      screen.getByRole("heading", { name: "Tofu pesto pasta" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /rest day/i }));
    expect(screen.getByRole("heading", { name: /rest day fuel/i })).toBeInTheDocument();
    const chicken = screen.getByRole("radio", { name: /chicken optional/i });
    await user.click(chicken);
    expect(chicken).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("heading", { name: "Chicken pesto pasta" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Tofu pesto pasta" })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ 250 ml" }));
    expect(screen.getByText("250 ml")).toBeInTheDocument();
  });

  it("shows the retained honey portion in the adjusted climbing plan", async () => {
    const user = userEvent.setup();
    renderWithProvider(<TodayPage />);
    const evening = await screen.findByRole("heading", {
      name: "Evening FAGE"
    });

    await user.click(evening);

    expect(
      screen.getByText("M Organic Squeezy Pure Clear Honey")
    ).toBeInTheDocument();
    expect(screen.getByText("5g")).toBeInTheDocument();
  });

  it("saves and removes a weight entry", async () => {
    const user = userEvent.setup();
    renderWithProvider(<TodayPage />);
    const input = await screen.findByLabelText("Weight in kilograms");
    await user.type(input, "72.4");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("72.4 kg recorded")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove weight entry" }));
    expect(screen.getByText("Optional daily check-in")).toBeInTheDocument();
  });

  it("persists settings changes", async () => {
    const user = userEvent.setup();
    renderWithProvider(<SettingsPage />);
    await screen.findByRole("heading", { name: "Settings" });
    await user.click(screen.getByRole("button", { name: /ocean/i }));
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    await user.clear(screen.getByLabelText("Climbing day (kcal)"));
    await user.type(screen.getByLabelText("Climbing day (kcal)"), "2400");
    await user.click(
      screen.getByRole("button", { name: "Save calorie targets" })
    );
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(saved.settings.theme).toBe("dark");
      expect(saved.settings.colourScheme).toBe("ocean");
      expect(saved.settings.calorieTargets.climbing).toBe(2400);
    });
  });
});
