import { shiftDateKey } from "@/lib/dates";
import { gradeScore } from "./grading";
import type { RangeId } from "@/features/tracking/progress";
import type { ClimbingSession, LoggedClimb } from "@/types/tracking";

export function selectClimbingSessionsInRange(
  sessions: ClimbingSession[],
  range: RangeId,
  endDate: string
): ClimbingSession[] {
  const sorted = [...sessions].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
  );
  if (range === "all") {
    return sorted.filter((session) => session.date <= endDate);
  }
  const startDate = shiftDateKey(endDate, -Number(range) + 1);
  return sorted.filter(
    (session) => session.date >= startDate && session.date <= endDate
  );
}

function representativeGrade(climbs: LoggedClimb[]): LoggedClimb | null {
  if (climbs.length === 0) return null;
  const sorted = [...climbs].sort((a, b) => gradeScore(a) - gradeScore(b));
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

export function getClimbingSummary(
  sessions: ClimbingSession[],
  range: RangeId
) {
  const totalMinutes = sessions.reduce(
    (sum, session) => sum + session.durationMinutes,
    0
  );
  const loggedClimbs = sessions.flatMap((session) => session.climbs);
  const sentClimbs = loggedClimbs.filter((climb) => climb.sent);
  const hardestSent =
    sentClimbs.length === 0
      ? null
      : sentClimbs.reduce((hardest, climb) =>
          gradeScore(climb) > gradeScore(hardest) ? climb : hardest
        );
  const rangeDays =
    range === "all"
      ? Math.max(
          7,
          sessions.length === 0
            ? 7
            : Math.round(
                (new Date(`${sessions.at(-1)!.date}T12:00:00`).getTime() -
                  new Date(`${sessions[0].date}T12:00:00`).getTime()) /
                  86_400_000
              ) + 1
        )
      : Number(range);

  return {
    sessionCount: sessions.length,
    totalMinutes,
    averageDuration:
      sessions.length === 0 ? 0 : Math.round(totalMinutes / sessions.length),
    averageDifficulty:
      sessions.length === 0
        ? 0
        : Math.round(
            (sessions.reduce(
              (sum, session) => sum + session.difficulty,
              0
            ) /
              sessions.length) *
              10
          ) / 10,
    sessionsPerWeek:
      sessions.length === 0
        ? 0
        : Math.round((sessions.length / (rangeDays / 7)) * 10) / 10,
    typicalGrade: representativeGrade(loggedClimbs),
    hardestSent
  };
}

export function formatClimbingTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}
