import { nutritionPlan } from "@/data/nutrition";
import type { DayPlanId, VariantId } from "@/types/nutrition";
import type {
  AppState,
  BackupFile,
  ClimbBand,
  ClimbingSession,
  ColourScheme,
  DailyLog,
  GymGradeColour,
  LoggedClimb,
  Settings,
  ThemePreference,
  WaterEntry
} from "@/types/tracking";

export const STORAGE_KEY = "nutrition-tracker:v1";

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  colourScheme: "ember",
  waterGoalMl: 2500,
  defaultDayPlanId: "climbing"
};

export function createDefaultState(): AppState {
  return {
    version: 1,
    nutritionSchemaVersion: nutritionPlan.meta.schema_version,
    settings: { ...DEFAULT_SETTINGS },
    logsByDate: {},
    climbingSessions: []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDayPlan(value: unknown): value is DayPlanId {
  return value === "climbing" || value === "rest";
}

function isVariant(value: unknown): value is VariantId {
  return value === "default" || value === "chicken_pasta";
}

function isTheme(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function isColourScheme(value: unknown): value is ColourScheme {
  return (
    value === "ember" ||
    value === "forest" ||
    value === "ocean" ||
    value === "berry"
  );
}

function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS };
  return {
    theme: isTheme(value.theme) ? value.theme : DEFAULT_SETTINGS.theme,
    colourScheme: isColourScheme(value.colourScheme)
      ? value.colourScheme
      : DEFAULT_SETTINGS.colourScheme,
    waterGoalMl:
      typeof value.waterGoalMl === "number" &&
      Number.isFinite(value.waterGoalMl) &&
      value.waterGoalMl >= 250 &&
      value.waterGoalMl <= 10000
        ? Math.round(value.waterGoalMl)
        : DEFAULT_SETTINGS.waterGoalMl,
    defaultDayPlanId: isDayPlan(value.defaultDayPlanId)
      ? value.defaultDayPlanId
      : DEFAULT_SETTINGS.defaultDayPlanId
  };
}

function isClimbBand(value: unknown): value is ClimbBand {
  return value === "easy" || value === "medium" || value === "hard";
}

function isGymGradeColour(value: unknown): value is GymGradeColour {
  return (
    value === "green" ||
    value === "orange" ||
    value === "yellow" ||
    value === "pink" ||
    value === "black" ||
    value === "blue" ||
    value === "purple" ||
    value === "mint"
  );
}

function parseClimbs(value: unknown): LoggedClimb[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((climb) => {
    if (
      !isRecord(climb) ||
      typeof climb.id !== "string" ||
      !isGymGradeColour(climb.gradeColour) ||
      !isClimbBand(climb.band) ||
      typeof climb.sent !== "boolean"
    ) {
      return [];
    }
    return [
      {
        id: climb.id,
        gradeColour: climb.gradeColour,
        band: climb.band,
        sent: climb.sent
      }
    ];
  });
}

function parseClimbingSessions(value: unknown): ClimbingSession[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((session) => {
    if (
      !isRecord(session) ||
      typeof session.id !== "string" ||
      typeof session.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(session.date) ||
      typeof session.durationMinutes !== "number" ||
      !Number.isFinite(session.durationMinutes) ||
      session.durationMinutes < 1 ||
      session.durationMinutes > 1440 ||
      typeof session.difficulty !== "number" ||
      !Number.isFinite(session.difficulty) ||
      session.difficulty < 0 ||
      session.difficulty > 10 ||
      typeof session.createdAt !== "string"
    ) {
      return [];
    }
    const notes =
      typeof session.notes === "string"
        ? session.notes.trim().slice(0, 1000)
        : "";
    return [
      {
        id: session.id,
        date: session.date,
        durationMinutes: Math.round(session.durationMinutes),
        difficulty: Math.round(session.difficulty * 10) / 10,
        climbs: parseClimbs(session.climbs),
        ...(notes ? { notes } : {}),
        createdAt: session.createdAt
      }
    ];
  });
}

function parseWaterEntries(value: unknown): WaterEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      typeof entry.amountMl !== "number" ||
      !Number.isFinite(entry.amountMl) ||
      entry.amountMl <= 0 ||
      typeof entry.createdAt !== "string"
    ) {
      return [];
    }
    return [
      {
        id: entry.id,
        amountMl: Math.round(entry.amountMl),
        createdAt: entry.createdAt
      }
    ];
  });
}

function parseLog(value: unknown, dateKey: string): DailyLog | null {
  if (
    !isRecord(value) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) ||
    !isDayPlan(value.dayPlanId) ||
    !isVariant(value.variantId)
  ) {
    return null;
  }
  const completedMealIds = Array.isArray(value.completedMealIds)
    ? [...new Set(value.completedMealIds.filter((id): id is string => typeof id === "string"))]
    : [];
  const weight =
    typeof value.weightKg === "number" &&
    Number.isFinite(value.weightKg) &&
    value.weightKg >= 25 &&
    value.weightKg <= 400
      ? Math.round(value.weightKg * 10) / 10
      : undefined;
  const fallbackTimestamp = new Date().toISOString();

  return {
    date: dateKey,
    dayPlanId: value.dayPlanId,
    variantId: value.variantId,
    completedMealIds,
    waterEntries: parseWaterEntries(value.waterEntries),
    ...(weight === undefined ? {} : { weightKg: weight }),
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : fallbackTimestamp,
    updatedAt:
      typeof value.updatedAt === "string" ? value.updatedAt : fallbackTimestamp
  };
}

function migrate(value: Record<string, unknown>): Record<string, unknown> {
  // Version 0 used `preferences`; accepting it makes future migrations explicit.
  if (value.version === 0) {
    return {
      ...value,
      version: 1,
      settings: value.settings ?? value.preferences
    };
  }
  return value;
}

export function parseAppState(input: string | unknown): AppState {
  let decoded: unknown;
  try {
    decoded = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    return createDefaultState();
  }
  if (!isRecord(decoded)) return createDefaultState();
  const migrated = migrate(decoded);
  if (migrated.version !== 1) return createDefaultState();

  const logsByDate: Record<string, DailyLog> = {};
  if (isRecord(migrated.logsByDate)) {
    for (const [date, candidate] of Object.entries(migrated.logsByDate)) {
      const log = parseLog(candidate, date);
      if (log) logsByDate[date] = log;
    }
  }

  return {
    version: 1,
    nutritionSchemaVersion:
      typeof migrated.nutritionSchemaVersion === "string"
        ? migrated.nutritionSchemaVersion
        : nutritionPlan.meta.schema_version,
    settings: parseSettings(migrated.settings),
    logsByDate,
    climbingSessions: parseClimbingSessions(migrated.climbingSessions)
  };
}

export function readState(storage: Pick<Storage, "getItem">): AppState {
  try {
    return parseAppState(storage.getItem(STORAGE_KEY) ?? "");
  } catch {
    return createDefaultState();
  }
}

export function writeState(
  storage: Pick<Storage, "setItem">,
  state: AppState
): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function createBackup(state: AppState): BackupFile {
  return {
    kind: "crux-nutrition-backup",
    exportedAt: new Date().toISOString(),
    data: state
  };
}

export function parseBackup(input: string): BackupFile | null {
  try {
    const decoded: unknown = JSON.parse(input);
    if (
      !isRecord(decoded) ||
      decoded.kind !== "crux-nutrition-backup" ||
      typeof decoded.exportedAt !== "string" ||
      !isRecord(decoded.data) ||
      decoded.data.version !== 1
    ) {
      return null;
    }
    return {
      kind: "crux-nutrition-backup",
      exportedAt: decoded.exportedAt,
      data: parseAppState(decoded.data)
    };
  } catch {
    return null;
  }
}
