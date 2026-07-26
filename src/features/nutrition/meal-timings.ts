import type { DayPlanId } from "@/types/nutrition";
import type {
  MealTimings,
  ReminderLeadMinutes
} from "@/types/tracking";

export interface MealTimingDefinition {
  mealId: string;
  label: string;
  defaultTime: string;
  defaultReminderMinutes: ReminderLeadMinutes;
}

export const MEAL_TIMING_DEFINITIONS: Record<
  DayPlanId,
  MealTimingDefinition[]
> = {
  climbing: [
    {
      mealId: "breakfast",
      label: "Breakfast",
      defaultTime: "08:00",
      defaultReminderMinutes: 15
    },
    {
      mealId: "rice_bowl",
      label: "Rice bowl",
      defaultTime: "12:30",
      defaultReminderMinutes: 30
    },
    {
      mealId: "pre_climbing",
      label: "Pre-climbing meal",
      defaultTime: "17:15",
      defaultReminderMinutes: 15
    },
    {
      mealId: "during_climbing",
      label: "During climbing",
      defaultTime: "19:00",
      defaultReminderMinutes: 15
    },
    {
      mealId: "dinner",
      label: "Pasta dinner",
      defaultTime: "21:00",
      defaultReminderMinutes: 30
    },
    {
      mealId: "evening",
      label: "Evening FAGE",
      defaultTime: "22:15",
      defaultReminderMinutes: 15
    }
  ],
  rest: [
    {
      mealId: "breakfast",
      label: "Breakfast",
      defaultTime: "08:00",
      defaultReminderMinutes: 15
    },
    {
      mealId: "rice_bowl",
      label: "Rice bowl",
      defaultTime: "12:30",
      defaultReminderMinutes: 30
    },
    {
      mealId: "snack",
      label: "Afternoon snack",
      defaultTime: "16:00",
      defaultReminderMinutes: 15
    },
    {
      mealId: "dinner",
      label: "Pasta dinner",
      defaultTime: "19:00",
      defaultReminderMinutes: 30
    },
    {
      mealId: "evening",
      label: "Evening FAGE",
      defaultTime: "21:30",
      defaultReminderMinutes: 15
    }
  ]
};

export const REMINDER_LEAD_OPTIONS: Array<{
  value: ReminderLeadMinutes;
  label: string;
}> = [
  { value: 0, label: "Off" },
  { value: 15, label: "15 min before" },
  { value: 30, label: "30 min before" },
  { value: 45, label: "45 min before" },
  { value: 60, label: "1 hour before" }
];

export function createDefaultMealTimings(): MealTimings {
  return {
    climbing: Object.fromEntries(
      MEAL_TIMING_DEFINITIONS.climbing.map((meal) => [
        meal.mealId,
        {
          time: meal.defaultTime,
          reminderMinutes: meal.defaultReminderMinutes
        }
      ])
    ),
    rest: Object.fromEntries(
      MEAL_TIMING_DEFINITIONS.rest.map((meal) => [
        meal.mealId,
        {
          time: meal.defaultTime,
          reminderMinutes: meal.defaultReminderMinutes
        }
      ])
    )
  };
}
