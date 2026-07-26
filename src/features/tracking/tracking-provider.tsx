"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore
} from "react";
import { getValidMealIds } from "@/features/nutrition/selectors";
import {
  createDefaultState,
  readState,
  STORAGE_KEY,
  writeState
} from "./storage";
import type { DayPlanId, VariantId } from "@/types/nutrition";
import type {
  AppState,
  DailyLog,
  Settings,
} from "@/types/tracking";

interface TrackingContextValue {
  state: AppState;
  hydrated: boolean;
  storageAvailable: boolean;
  toggleMeal: (
    date: string,
    mealId: string,
    fallbackPlan: DayPlanId,
    fallbackVariant: VariantId
  ) => void;
  setDayPlan: (date: string, plan: DayPlanId) => void;
  setVariant: (date: string, variant: VariantId) => void;
  addWater: (
    date: string,
    amountMl: number,
    fallbackPlan: DayPlanId,
    fallbackVariant: VariantId
  ) => void;
  removeLastWater: (date: string) => void;
  setWeight: (
    date: string,
    weightKg: number | undefined,
    fallbackPlan: DayPlanId,
    fallbackVariant: VariantId
  ) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceState: (state: AppState) => void;
  resetState: () => void;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);
const subscribeToHydration = () => () => {};

function newLog(
  date: string,
  settings: Settings,
  plan?: DayPlanId,
  variant: VariantId = "default"
): DailyLog {
  const now = new Date().toISOString();
  return {
    date,
    dayPlanId: plan ?? settings.defaultDayPlanId,
    variantId: variant,
    completedMealIds: [],
    waterEntries: [],
    createdAt: now,
    updatedAt: now
  };
}

function uniqueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() =>
    typeof window === "undefined"
      ? createDefaultState()
      : readState(window.localStorage)
  );
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    const saved = writeState(window.localStorage, state);
    const updateAvailability = window.setTimeout(
      () => setStorageAvailable(saved),
      0
    );
    return () => window.clearTimeout(updateAvailability);
  }, [hydrated, state]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setState(readState(window.localStorage));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const preference = state.settings.theme;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = preference === "dark" || (preference === "system" && media.matches);
      root.dataset.theme = dark ? "dark" : "light";
      root.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [state.settings.theme]);

  const updateLog = useCallback(
    (
      date: string,
      updater: (log: DailyLog, state: AppState) => DailyLog,
      fallbackPlan?: DayPlanId,
      fallbackVariant?: VariantId
    ) => {
      setState((current) => {
        const existing =
          current.logsByDate[date] ??
          newLog(date, current.settings, fallbackPlan, fallbackVariant);
        const updated = updater(existing, current);
        return {
          ...current,
          logsByDate: {
            ...current.logsByDate,
            [date]: { ...updated, updatedAt: new Date().toISOString() }
          }
        };
      });
    },
    []
  );

  const value = useMemo<TrackingContextValue>(
    () => ({
      state,
      hydrated,
      storageAvailable,
      toggleMeal: (date, mealId, fallbackPlan, fallbackVariant) =>
        updateLog(
          date,
          (log) => ({
            ...log,
            completedMealIds: log.completedMealIds.includes(mealId)
              ? log.completedMealIds.filter((id) => id !== mealId)
              : [...log.completedMealIds, mealId]
          }),
          fallbackPlan,
          fallbackVariant
        ),
      setDayPlan: (date, plan) =>
        updateLog(date, (log) => {
          const valid = getValidMealIds(plan, log.variantId);
          return {
            ...log,
            dayPlanId: plan,
            completedMealIds: log.completedMealIds.filter((id) => valid.has(id))
          };
        }, plan),
      setVariant: (date, variant) =>
        updateLog(date, (log) => {
          const valid = getValidMealIds(log.dayPlanId, variant);
          return {
            ...log,
            variantId: variant,
            completedMealIds: log.completedMealIds.filter((id) => valid.has(id))
          };
        }),
      addWater: (date, amountMl, fallbackPlan, fallbackVariant) => {
        if (!Number.isFinite(amountMl) || amountMl <= 0 || amountMl > 5000) return;
        updateLog(
          date,
          (log) => ({
            ...log,
            waterEntries: [
              ...log.waterEntries,
              {
                id: uniqueId(),
                amountMl: Math.round(amountMl),
                createdAt: new Date().toISOString()
              }
            ]
          }),
          fallbackPlan,
          fallbackVariant
        );
      },
      removeLastWater: (date) =>
        updateLog(date, (log) => ({
          ...log,
          waterEntries: log.waterEntries.slice(0, -1)
        })),
      setWeight: (date, weightKg, fallbackPlan, fallbackVariant) =>
        updateLog(
          date,
          (log) => {
            const next = { ...log };
            if (weightKg === undefined) delete next.weightKg;
            else next.weightKg = Math.round(weightKg * 10) / 10;
            return next;
          },
          fallbackPlan,
          fallbackVariant
        ),
      updateSettings: (patch) =>
        setState((current) => ({
          ...current,
          settings: { ...current.settings, ...patch }
        })),
      replaceState: setState,
      resetState: () => setState(createDefaultState())
    }),
    [hydrated, state, storageAvailable, updateLog]
  );

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextValue {
  const context = useContext(TrackingContext);
  if (!context) throw new Error("useTracking must be used within TrackingProvider");
  return context;
}

export function resolveLogDefaults(
  log: DailyLog | undefined,
  defaultPlan: DayPlanId
): Pick<DailyLog, "dayPlanId" | "variantId"> {
  return log ?? { dayPlanId: defaultPlan, variantId: "default" };
}
