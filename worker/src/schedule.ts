import type { DayPlanId } from "../../src/types/nutrition";
import type { ReminderSchedule } from "../../src/types/notifications";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  rice_bowl: "Rice bowl",
  pre_climbing: "Pre-climbing meal",
  during_climbing: "During-climbing fuel",
  snack: "Afternoon snack",
  dinner: "Pasta dinner",
  evening: "Evening FAGE"
};

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface ScheduledMealReminder {
  id: string;
  runAt: number;
  mealId: string;
  mealLabel: string;
  mealTime: string;
  reminderMinutes: number;
  dayPlanId: DayPlanId;
}

function zonedParts(
  timestamp: number,
  formatter: Intl.DateTimeFormat
): ZonedParts {
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(timestamp))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
  return parts as unknown as ZonedParts;
}

function dateKeyAt(
  timestamp: number,
  formatter: Intl.DateTimeFormat
): string {
  const parts = zonedParts(timestamp, formatter);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day
  ).padStart(2, "0")}`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function offsetAt(
  timestamp: number,
  formatter: Intl.DateTimeFormat
): number {
  const parts = zonedParts(timestamp, formatter);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return representedAsUtc - Math.floor(timestamp / 1000) * 1000;
}

function localDateTimeToUtc(
  dateKey: string,
  time: string,
  formatter: Intl.DateTimeFormat
): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const firstPass = guess - offsetAt(guess, formatter);
  return guess - offsetAt(firstPass, formatter);
}

export function findNextMealReminder(
  schedule: ReminderSchedule,
  afterTimestamp: number
): ScheduledMealReminder | null {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: schedule.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const today = dateKeyAt(afterTimestamp, formatter);

  for (let dayOffset = 0; dayOffset < 62; dayOffset += 1) {
    const dateKey = shiftDateKey(today, dayOffset);
    const dayPlanId =
      schedule.dayPlanOverrides[dateKey] ?? schedule.defaultDayPlanId;
    const timings = schedule.mealTimings[dayPlanId];
    const dayCandidates: ScheduledMealReminder[] = [];

    for (const [mealId, timing] of Object.entries(timings)) {
      if (timing.reminderMinutes === 0) continue;
      const mealAt = localDateTimeToUtc(
        dateKey,
        timing.time,
        formatter
      );
      const runAt = mealAt - timing.reminderMinutes * 60_000;
      if (runAt <= afterTimestamp) continue;
      dayCandidates.push({
        id: `${dateKey}-${mealId}-${runAt}`,
        runAt,
        mealId,
        mealLabel: MEAL_LABELS[mealId] ?? "Meal",
        mealTime: timing.time,
        reminderMinutes: timing.reminderMinutes,
        dayPlanId
      });
    }
    dayCandidates.sort((left, right) => left.runAt - right.runAt);
    if (dayCandidates[0]) return dayCandidates[0];
  }

  return null;
}
