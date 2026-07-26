import { describe, expect, it } from "vitest";
import {
  getProgressSummary,
  logCompletion,
  selectLogsInRange,
  waterTotal,
  weightChange
} from "./progress";
import type { DailyLog } from "@/types/tracking";

function log(
  date: string,
  extras: Partial<DailyLog> = {}
): DailyLog {
  return {
    date,
    dayPlanId: "rest",
    variantId: "default",
    completedMealIds: [],
    waterEntries: [],
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
    ...extras
  };
}

describe("progress calculations", () => {
  it("totals individual water entries", () => {
    expect(
      waterTotal(
        log("2026-07-25", {
          waterEntries: [
            { id: "a", amountMl: 250, createdAt: "x" },
            { id: "b", amountMl: 500, createdAt: "x" }
          ]
        })
      )
    ).toBe(750);
  });

  it("calculates meal completion against the selected plan", () => {
    const result = logCompletion(
      log("2026-07-25", { completedMealIds: ["breakfast", "rice_bowl", "bad-id"] })
    );
    expect(result).toEqual({ completed: 2, total: 5, percentage: 40 });
  });

  it("calculates weight changes and range summaries", () => {
    const logs = [
      log("2026-07-20", { weightKg: 72.4 }),
      log("2026-07-25", { weightKg: 71.8 })
    ];
    expect(weightChange(logs)).toBe(-0.6);
    expect(getProgressSummary(logs).latestWeight).toBe(71.8);
  });

  it("selects calendar ranges ending on the requested local date", () => {
    const logs = {
      old: log("2026-07-01"),
      recent: log("2026-07-25")
    };
    expect(selectLogsInRange(logs, "7", "2026-07-26").map((item) => item.date))
      .toEqual(["2026-07-25"]);
  });
});
