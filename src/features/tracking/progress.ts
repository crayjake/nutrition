import { getMeals } from "@/features/nutrition/selectors";
import type { DailyLog } from "@/types/tracking";

export type RangeId = "7" | "30" | "90" | "all";

export function waterTotal(log?: DailyLog): number {
  return log?.waterEntries.reduce((sum, entry) => sum + entry.amountMl, 0) ?? 0;
}

export function logCompletion(log: DailyLog): {
  completed: number;
  total: number;
  percentage: number;
} {
  const mealIds = new Set(
    getMeals(log.dayPlanId, log.variantId).map(
      (meal) => meal.meal_instance_id
    )
  );
  const completed = log.completedMealIds.filter((id) => mealIds.has(id)).length;
  const total = mealIds.size;
  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100)
  };
}

export function selectLogsInRange(
  logsByDate: Record<string, DailyLog>,
  range: RangeId,
  endDate: string
): DailyLog[] {
  const dates = Object.values(logsByDate).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  if (range === "all") return dates.filter((log) => log.date <= endDate);
  const end = new Date(`${endDate}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - Number(range) + 1);
  const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return dates.filter((log) => log.date >= key && log.date <= endDate);
}

export function weightChange(logs: DailyLog[]): number | null {
  const weights = logs.filter(
    (log): log is DailyLog & { weightKg: number } =>
      typeof log.weightKg === "number"
  );
  if (weights.length < 2) return null;
  return Math.round((weights.at(-1)!.weightKg - weights[0].weightKg) * 10) / 10;
}

export function getProgressSummary(logs: DailyLog[]) {
  const completion = logs.map(logCompletion);
  const weightLogs = logs.filter(
    (log): log is DailyLog & { weightKg: number } =>
      typeof log.weightKg === "number"
  );
  return {
    latestWeight: weightLogs.at(-1)?.weightKg ?? null,
    weightChange: weightChange(logs),
    averageWater:
      logs.length === 0
        ? 0
        : Math.round(
            logs.reduce((sum, log) => sum + waterTotal(log), 0) / logs.length
          ),
    adherence:
      completion.length === 0
        ? 0
        : Math.round(
            completion.reduce((sum, item) => sum + item.percentage, 0) /
              completion.length
          ),
    completeDays: completion.filter(
      (item) => item.total > 0 && item.completed === item.total
    ).length
  };
}
