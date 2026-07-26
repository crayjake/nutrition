import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrackingProvider } from "@/features/tracking/tracking-provider";
import { NotificationSettings } from "./notification-settings";
import {
  getPushConnectionStatus,
  scheduleTestNotification
} from "./push-client";

vi.mock("./push-client", () => ({
  disablePushNotifications: vi.fn(),
  enablePushNotifications: vi.fn(),
  getPushConnectionStatus: vi.fn(),
  scheduleTestNotification: vi.fn(),
  syncPushSchedule: vi.fn().mockResolvedValue(false)
}));

describe("notification settings", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getPushConnectionStatus).mockResolvedValue("enabled");
    vi.mocked(scheduleTestNotification).mockResolvedValue();
  });

  it("schedules a real push test with a ten-second delay", async () => {
    const user = userEvent.setup();
    render(
      <TrackingProvider>
        <NotificationSettings />
      </TrackingProvider>
    );

    const button = await screen.findByRole("button", {
      name: "Send test in 10 seconds"
    });
    await user.click(button);

    expect(scheduleTestNotification).toHaveBeenCalledOnce();
    expect(
      screen.getByText(/should arrive in about 10 seconds/i)
    ).toBeInTheDocument();
  });
});
