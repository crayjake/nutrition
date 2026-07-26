import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TrackingProvider } from "@/features/tracking/tracking-provider";
import { STORAGE_KEY } from "@/features/tracking/storage";
import { ClimbingPage } from "./climbing-page";

describe("climbing log", () => {
  beforeEach(() => localStorage.clear());

  it("saves a session with optional gym-grade detail", async () => {
    const user = userEvent.setup();
    render(
      <TrackingProvider>
        <ClimbingPage />
      </TrackingProvider>
    );

    await screen.findByRole("heading", { name: "Climbing" });
    const length = screen.getByLabelText("Length (minutes)");
    await user.clear(length);
    await user.type(length, "75");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("radio", { name: /blue/i }));
    await user.click(
      screen.getByRole("radio", {
        name: "Hard"
      })
    );
    await user.click(screen.getByRole("checkbox", { name: /sent/i }));
    await user.click(screen.getByRole("button", { name: "Save session" }));

    expect(screen.getByText("Climbing session saved.")).toBeInTheDocument();
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(saved.climbingSessions).toHaveLength(1);
      expect(saved.climbingSessions[0]).toMatchObject({
        durationMinutes: 75,
        difficulty: 6,
        climbs: [
          {
            gradeColour: "blue",
            band: "hard",
            sent: true
          }
        ]
      });
    });
  });
});
