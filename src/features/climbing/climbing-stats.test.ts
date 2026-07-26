import { describe, expect, it } from "vitest";
import {
  formatClimbingTime,
  getClimbingSummary,
  selectClimbingSessionsInRange
} from "./climbing-stats";
import type { ClimbingSession } from "@/types/tracking";

const sessions: ClimbingSession[] = [
  {
    id: "older",
    date: "2026-06-01",
    durationMinutes: 60,
    difficulty: 4,
    climbs: [],
    createdAt: "2026-06-01T12:00:00.000Z"
  },
  {
    id: "one",
    date: "2026-07-20",
    durationMinutes: 90,
    difficulty: 6,
    climbs: [
      {
        id: "blue-medium",
        gradeColour: "blue",
        band: "medium",
        sent: true
      },
      {
        id: "purple-hard",
        gradeColour: "purple",
        band: "hard",
        sent: false
      }
    ],
    createdAt: "2026-07-20T12:00:00.000Z"
  },
  {
    id: "two",
    date: "2026-07-25",
    durationMinutes: 120,
    difficulty: 8,
    climbs: [
      {
        id: "blue-hard",
        gradeColour: "blue",
        band: "hard",
        sent: true
      }
    ],
    createdAt: "2026-07-25T12:00:00.000Z"
  }
];

describe("climbing stats", () => {
  it("filters sessions to the selected period", () => {
    expect(
      selectClimbingSessionsInRange(sessions, "7", "2026-07-26").map(
        (session) => session.id
      )
    ).toEqual(["one", "two"]);
  });

  it("summarises sessions without relying on climb counts", () => {
    const summary = getClimbingSummary(sessions.slice(1), "7");
    expect(summary).toMatchObject({
      sessionCount: 2,
      totalMinutes: 210,
      averageDuration: 105,
      averageDifficulty: 7,
      sessionsPerWeek: 2
    });
    expect(summary.typicalGrade?.gradeColour).toBe("blue");
    expect(summary.hardestSent?.gradeColour).toBe("blue");
  });

  it("formats time for compact stat cards", () => {
    expect(formatClimbingTime(45)).toBe("45m");
    expect(formatClimbingTime(135)).toBe("2h 15m");
  });
});
