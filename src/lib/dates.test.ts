import { describe, expect, it } from "vitest";
import { formatDate, fromDateKey, shiftDateKey, toLocalDateKey } from "./dates";

describe("local date helpers", () => {
  it("uses local calendar components instead of UTC conversion", () => {
    const date = new Date(2026, 6, 26, 23, 59);
    expect(toLocalDateKey(date)).toBe("2026-07-26");
  });

  it("shifts across month boundaries", () => {
    expect(shiftDateKey("2026-07-31", 1)).toBe("2026-08-01");
    expect(shiftDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("parses and formats valid keys", () => {
    expect(fromDateKey("2026-07-26").getDate()).toBe(26);
    expect(formatDate("2026-07-26")).toMatch(/26 July/);
  });
});
