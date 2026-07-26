import type { DayPlanId, VariantId } from "./nutrition";

export type ThemePreference = "system" | "light" | "dark";

export interface WaterEntry {
  id: string;
  amountMl: number;
  createdAt: string;
}

export interface DailyLog {
  date: string;
  dayPlanId: DayPlanId;
  variantId: VariantId;
  completedMealIds: string[];
  waterEntries: WaterEntry[];
  weightKg?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  theme: ThemePreference;
  waterGoalMl: number;
  defaultDayPlanId: DayPlanId;
}

export interface AppState {
  version: 1;
  nutritionSchemaVersion: string;
  settings: Settings;
  logsByDate: Record<string, DailyLog>;
}

export interface BackupFile {
  kind: "crux-nutrition-backup";
  exportedAt: string;
  data: AppState;
}
