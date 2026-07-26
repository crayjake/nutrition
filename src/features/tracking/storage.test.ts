import { describe, expect, it } from "vitest";
import {
  createBackup,
  createDefaultState,
  parseAppState,
  parseBackup,
  readState,
  writeState
} from "./storage";

describe("tracking storage", () => {
  it("recovers from corrupt JSON", () => {
    expect(parseAppState("{broken")).toEqual(createDefaultState());
  });

  it("keeps valid logs while dropping a corrupt record", () => {
    const parsed = parseAppState({
      version: 1,
      nutritionSchemaVersion: "1.0.0",
      settings: { theme: "dark", waterGoalMl: 3000, defaultDayPlanId: "rest" },
      logsByDate: {
        "2026-07-25": {
          dayPlanId: "rest",
          variantId: "default",
          completedMealIds: ["breakfast"],
          waterEntries: []
        },
        "not-a-date": { dayPlanId: "bad" }
      }
    });
    expect(parsed.settings.theme).toBe("dark");
    expect(parsed.settings.colourScheme).toBe("ember");
    expect(parsed.settings.calorieTargets).toEqual({
      climbing: 2200,
      rest: 1900
    });
    expect(parsed.settings.mealTimings.climbing.breakfast).toEqual({
      time: "08:00",
      reminderMinutes: 15
    });
    expect(Object.keys(parsed.logsByDate)).toEqual(["2026-07-25"]);
  });

  it("validates calorie targets independently", () => {
    const parsed = parseAppState({
      version: 1,
      settings: {
        theme: "system",
        colourScheme: "forest",
        waterGoalMl: 2500,
        defaultDayPlanId: "climbing",
        calorieTargets: {
          climbing: 2400,
          rest: 9999
        }
      },
      logsByDate: {}
    });

    expect(parsed.settings.calorieTargets).toEqual({
      climbing: 2400,
      rest: 1900
    });
  });

  it("preserves valid meal timings and repairs invalid values", () => {
    const parsed = parseAppState({
      version: 1,
      settings: {
        mealTimings: {
          climbing: {
            breakfast: {
              time: "07:30",
              reminderMinutes: 30
            },
            rice_bowl: {
              time: "25:90",
              reminderMinutes: 12
            }
          }
        }
      },
      logsByDate: {}
    });

    expect(parsed.settings.mealTimings.climbing.breakfast).toEqual({
      time: "07:30",
      reminderMinutes: 30
    });
    expect(parsed.settings.mealTimings.climbing.rice_bowl).toEqual({
      time: "12:30",
      reminderMinutes: 30
    });
  });

  it("migrates the old climbing schedule and leaves fuel snacks unscheduled", () => {
    const parsed = parseAppState({
      version: 1,
      settings: {
        mealTimings: {
          climbing: {
            pre_climbing: {
              time: "17:15",
              reminderMinutes: 15
            },
            during_climbing: {
              time: "19:00",
              reminderMinutes: 15
            },
            dinner: {
              time: "21:00",
              reminderMinutes: 30
            }
          }
        }
      },
      logsByDate: {}
    });

    expect(parsed.settings.mealTimings.climbing.dinner).toEqual({
      time: "19:00",
      reminderMinutes: 30
    });
    expect(parsed.settings.mealTimings.climbing).not.toHaveProperty(
      "pre_climbing"
    );
    expect(parsed.settings.mealTimings.climbing).not.toHaveProperty(
      "during_climbing"
    );
  });

  it("preserves valid climbing sessions and drops corrupt entries", () => {
    const parsed = parseAppState({
      version: 1,
      settings: {
        theme: "light",
        colourScheme: "ocean",
        waterGoalMl: 2500,
        defaultDayPlanId: "climbing"
      },
      logsByDate: {},
      climbingSessions: [
        {
          id: "session-1",
          date: "2026-07-25",
          durationMinutes: 90,
          difficulty: 7,
          createdAt: "2026-07-25T20:00:00.000Z",
          climbs: [
            {
              id: "climb-1",
              gradeColour: "blue",
              band: "hard",
              sent: true
            }
          ]
        },
        {
          id: "bad-session",
          date: "yesterday",
          durationMinutes: -1
        }
      ]
    });

    expect(parsed.settings.colourScheme).toBe("ocean");
    expect(parsed.climbingSessions).toHaveLength(1);
    expect(parsed.climbingSessions[0].climbs[0]).toMatchObject({
      gradeColour: "blue",
      band: "hard",
      sent: true
    });
  });

  it("migrates version zero preferences", () => {
    const parsed = parseAppState({
      version: 0,
      preferences: { theme: "light", waterGoalMl: 2000, defaultDayPlanId: "rest" },
      logsByDate: {}
    });
    expect(parsed.version).toBe(1);
    expect(parsed.settings.defaultDayPlanId).toBe("rest");
  });

  it("validates versioned backup files", () => {
    const backup = createBackup(createDefaultState());
    expect(parseBackup(JSON.stringify(backup))?.kind).toBe("crux-nutrition-backup");
    expect(parseBackup('{"kind":"other"}')).toBeNull();
  });

  it("handles unavailable storage without throwing", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      }
    };
    expect(readState(broken)).toEqual(createDefaultState());
    expect(writeState(broken, createDefaultState())).toBe(false);
  });
});
