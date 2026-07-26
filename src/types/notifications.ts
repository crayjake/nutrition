import type { DayPlanId } from "./nutrition";
import type { MealTimings } from "./tracking";

export interface SerializedPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export interface ReminderSchedule {
  timeZone: string;
  defaultDayPlanId: DayPlanId;
  dayPlanOverrides: Record<string, DayPlanId>;
  mealTimings: MealTimings;
}

export interface NotificationRegistration {
  subscription: SerializedPushSubscription;
  schedule: ReminderSchedule;
}

export interface PushMessage {
  title: string;
  body: string;
  tag: string;
  icon: string;
  url: string;
}
