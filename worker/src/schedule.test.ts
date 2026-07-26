import { describe, expect, it } from "vitest";
import type { ReminderSchedule } from "../../src/types/notifications";
import { findNextMealReminder } from "./schedule";

function schedule(
  timeZone = "Europe/London",
  defaultDayPlanId: "climbing" | "rest" = "climbing"
): ReminderSchedule {
  return {
    timeZone,
    defaultDayPlanId,
    dayPlanOverrides: {},
    mealTimings: {
      climbing: {
        breakfast: { time: "08:00", reminderMinutes: 15 },
        dinner: { time: "21:00", reminderMinutes: 30 }
      },
      rest: {
        breakfast: { time: "09:00", reminderMinutes: 15 },
        dinner: { time: "19:00", reminderMinutes: 30 }
      }
    }
  };
}

describe("meal reminder scheduling", () => {
  it("converts summer meal times to UTC", () => {
    const reminder = findNextMealReminder(
      schedule(),
      Date.parse("2026-07-26T06:00:00Z")
    );

    expect(reminder?.mealId).toBe("breakfast");
    expect(reminder?.runAt).toBe(Date.parse("2026-07-26T06:45:00Z"));
  });

  it("handles winter time without a fixed UTC offset", () => {
    const reminder = findNextMealReminder(
      schedule(),
      Date.parse("2026-12-10T06:00:00Z")
    );

    expect(reminder?.runAt).toBe(Date.parse("2026-12-10T07:45:00Z"));
  });

  it("uses a dated day-plan override", () => {
    const reminderSchedule = schedule();
    reminderSchedule.dayPlanOverrides["2026-07-26"] = "rest";

    const reminder = findNextMealReminder(
      reminderSchedule,
      Date.parse("2026-07-26T06:00:00Z")
    );

    expect(reminder?.dayPlanId).toBe("rest");
    expect(reminder?.runAt).toBe(Date.parse("2026-07-26T07:45:00Z"));
  });
});
