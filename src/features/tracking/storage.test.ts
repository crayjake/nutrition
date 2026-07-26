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
    expect(Object.keys(parsed.logsByDate)).toEqual(["2026-07-25"]);
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
