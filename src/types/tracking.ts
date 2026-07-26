import type { DayPlanId, VariantId } from "./nutrition";

export type ThemePreference = "system" | "light" | "dark";
export type ColourScheme = "ember" | "forest" | "ocean" | "berry";
export type ClimbBand = "easy" | "medium" | "hard";
export type GymGradeColour =
  | "green"
  | "orange"
  | "yellow"
  | "pink"
  | "black"
  | "blue"
  | "purple"
  | "mint";

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
  colourScheme: ColourScheme;
  waterGoalMl: number;
  defaultDayPlanId: DayPlanId;
}

export interface LoggedClimb {
  id: string;
  gradeColour: GymGradeColour;
  band: ClimbBand;
  sent: boolean;
}

export interface ClimbingSession {
  id: string;
  date: string;
  durationMinutes: number;
  difficulty: number;
  climbs: LoggedClimb[];
  notes?: string;
  createdAt: string;
}

export interface AppState {
  version: 1;
  nutritionSchemaVersion: string;
  settings: Settings;
  logsByDate: Record<string, DailyLog>;
  climbingSessions: ClimbingSession[];
}

export interface BackupFile {
  kind: "crux-nutrition-backup";
  exportedAt: string;
  data: AppState;
}
