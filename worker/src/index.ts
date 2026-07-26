import webPush from "web-push";
import type {
  NotificationRegistration,
  PushMessage,
  ReminderSchedule,
  SerializedPushSubscription
} from "../../src/types/notifications";
import type { DayPlanId } from "../../src/types/nutrition";
import type {
  MealTimings,
  ReminderLeadMinutes
} from "../../src/types/tracking";
import {
  findNextMealReminder,
  type ScheduledMealReminder
} from "./schedule";

interface Env {
  REMINDER_SCHEDULERS: DurableObjectNamespace;
  APP_ORIGIN: string;
  APP_URL: string;
  APP_ICON_URL: string;
  PAIRING_CODE: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}

interface StoredRegistration extends NotificationRegistration {
  authHash: string;
  nextMeal: ScheduledMealReminder | null;
  testAt?: number;
}

const STATE_KEY = "registration";
const MAX_REQUEST_SIZE = 32_768;
const REMINDER_LEADS = new Set<ReminderLeadMinutes>([0, 15, 30, 45, 60]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDayPlanId(value: unknown): value is DayPlanId {
  return value === "climbing" || value === "rest";
}

function isValidTime(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }
  const [hours, minutes] = value.split(":").map(Number);
  return hours <= 23 && minutes <= 59;
}

function parseMealTimings(value: unknown): MealTimings | null {
  if (!isRecord(value)) return null;
  const parsed = {
    climbing: {},
    rest: {}
  } as MealTimings;

  for (const dayPlanId of ["climbing", "rest"] as const) {
    const day = value[dayPlanId];
    if (!isRecord(day) || Object.keys(day).length > 20) return null;
    for (const [mealId, candidate] of Object.entries(day)) {
      if (
        !/^[a-z0-9_]{1,40}$/.test(mealId) ||
        !isRecord(candidate) ||
        !isValidTime(candidate.time) ||
        !REMINDER_LEADS.has(
          candidate.reminderMinutes as ReminderLeadMinutes
        )
      ) {
        return null;
      }
      parsed[dayPlanId][mealId] = {
        time: candidate.time,
        reminderMinutes:
          candidate.reminderMinutes as ReminderLeadMinutes
      };
    }
  }

  return parsed;
}

function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 80) return false;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function parseSchedule(value: unknown): ReminderSchedule | null {
  if (!isRecord(value) || !isTimeZone(value.timeZone)) return null;
  if (!isDayPlanId(value.defaultDayPlanId)) return null;
  const mealTimings = parseMealTimings(value.mealTimings);
  if (!mealTimings || !isRecord(value.dayPlanOverrides)) return null;

  const dayPlanOverrides: Record<string, DayPlanId> = {};
  const entries = Object.entries(value.dayPlanOverrides);
  if (entries.length > 61) return null;
  for (const [date, dayPlanId] of entries) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isDayPlanId(dayPlanId)) {
      return null;
    }
    dayPlanOverrides[date] = dayPlanId;
  }

  return {
    timeZone: value.timeZone,
    defaultDayPlanId: value.defaultDayPlanId,
    dayPlanOverrides,
    mealTimings
  };
}

function parseSubscription(
  value: unknown
): SerializedPushSubscription | null {
  if (
    !isRecord(value) ||
    typeof value.endpoint !== "string" ||
    value.endpoint.length > 4096 ||
    !value.endpoint.startsWith("https://") ||
    !isRecord(value.keys) ||
    typeof value.keys.auth !== "string" ||
    typeof value.keys.p256dh !== "string" ||
    value.keys.auth.length > 512 ||
    value.keys.p256dh.length > 512 ||
    !(
      value.expirationTime === null ||
      (typeof value.expirationTime === "number" &&
        Number.isFinite(value.expirationTime))
    )
  ) {
    return null;
  }
  return {
    endpoint: value.endpoint,
    expirationTime: value.expirationTime,
    keys: {
      auth: value.keys.auth,
      p256dh: value.keys.p256dh
    }
  };
}

function parseRegistration(value: unknown): NotificationRegistration | null {
  if (!isRecord(value)) return null;
  const subscription = parseSubscription(value.subscription);
  const schedule = parseSchedule(value.schedule);
  return subscription && schedule ? { subscription, schedule } : null;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7);
  return /^[A-Za-z0-9_-]{32,128}$/.test(token) ? token : null;
}

function isAllowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get("Origin");
  return (
    origin === null ||
    origin === env.APP_ORIGIN ||
    origin === "http://localhost:3000"
  );
}

function withCors(response: Response, request: Request, env: Env): Response {
  const origin = request.headers.get("Origin");
  const headers = new Headers(response.headers);
  if (origin && isAllowedOrigin(request, env)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  headers.set("Vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function routeToScheduler(
  request: Request,
  env: Env,
  installationId: string,
  action: string
): Promise<Response> {
  const token = readBearerToken(request);
  if (!token) return json({ error: "Unauthorised" }, 401);

  const body = request.method === "POST" ? await request.text() : undefined;
  if (body && body.length > MAX_REQUEST_SIZE) {
    return json({ error: "Request too large" }, 413);
  }

  const schedulerId =
    env.REMINDER_SCHEDULERS.idFromName(installationId);
  const scheduler = env.REMINDER_SCHEDULERS.get(schedulerId);
  const headers = new Headers({
    "X-Auth-Hash": await sha256(token),
    "Content-Type": "application/json"
  });
  const pairingCode = request.headers.get("X-Pairing-Code");
  if (pairingCode) headers.set("X-Pairing-Code", pairingCode);

  return scheduler.fetch(
    new Request(`https://scheduler.internal/${action}`, {
      method: request.method,
      headers,
      body
    })
  );
}

const worker: ExportedHandler<Env> = {
  async fetch(request, env) {
    if (!isAllowedOrigin(request, env)) {
      return json({ error: "Origin not allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return withCors(
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Headers":
              "Authorization, Content-Type, X-Pairing-Code",
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Max-Age": "86400"
          }
        }),
        request,
        env
      );
    }

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return withCors(json({ ok: true }), request, env);
    }
    if (request.method === "GET" && url.pathname === "/vapid-public-key") {
      return withCors(
        json({ publicKey: env.VAPID_PUBLIC_KEY }),
        request,
        env
      );
    }

    const match = url.pathname.match(
      /^\/installations\/([A-Za-z0-9_-]{20,80})(?:\/(test))?$/
    );
    if (!match) return withCors(json({ error: "Not found" }, 404), request, env);

    let action: string;
    if (match[2] === "test" && request.method === "POST") {
      action = "test";
    } else if (!match[2] && request.method === "POST") {
      action = "registration";
    } else if (!match[2] && request.method === "DELETE") {
      action = "registration";
    } else {
      return withCors(
        json({ error: "Method not allowed" }, 405),
        request,
        env
      );
    }

    const response = await routeToScheduler(
      request,
      env,
      match[1],
      action
    );
    return withCors(response, request, env);
  }
};

export default worker;

export class ReminderScheduler {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env
  ) {}

  private async getRegistration(): Promise<StoredRegistration | null> {
    return (
      (await this.state.storage.get<StoredRegistration>(STATE_KEY)) ?? null
    );
  }

  private async pairingCodeMatches(candidate: string): Promise<boolean> {
    if (!candidate || !this.env.PAIRING_CODE) return false;
    const [candidateHash, expectedHash] = await Promise.all([
      sha256(candidate),
      sha256(this.env.PAIRING_CODE)
    ]);
    return candidateHash === expectedHash;
  }

  private async setNextAlarm(
    registration: StoredRegistration
  ): Promise<void> {
    const timestamps = [
      registration.nextMeal?.runAt,
      registration.testAt
    ].filter((value): value is number => typeof value === "number");
    if (timestamps.length === 0) {
      await this.state.storage.deleteAlarm();
      console.log(JSON.stringify({ event: "alarm.cleared" }));
      return;
    }
    const scheduledAt = Math.min(...timestamps);
    await this.state.storage.setAlarm(scheduledAt);
    console.log(
      JSON.stringify({
        event: "alarm.scheduled",
        scheduledAt,
        confirmedAt: await this.state.storage.getAlarm()
      })
    );
  }

  private async save(registration: StoredRegistration): Promise<void> {
    await this.state.storage.put(STATE_KEY, registration);
    await this.setNextAlarm(registration);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const authHash = request.headers.get("X-Auth-Hash");
    if (!authHash) return json({ error: "Unauthorised" }, 401);

    const existing = await this.getRegistration();
    if (existing && existing.authHash !== authHash) {
      return json({ error: "Unauthorised" }, 401);
    }

    if (url.pathname === "/registration" && request.method === "DELETE") {
      if (!existing) return json({ ok: true });
      await this.state.storage.deleteAll();
      return json({ ok: true });
    }

    if (url.pathname === "/registration" && request.method === "POST") {
      if (
        !existing &&
        !(await this.pairingCodeMatches(
          request.headers.get("X-Pairing-Code") ?? ""
        ))
      ) {
        return json({ error: "Incorrect setup code" }, 403);
      }
      let payload: unknown;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "Invalid registration" }, 400);
      }
      const registration = parseRegistration(payload);
      if (!registration) {
        return json({ error: "Invalid registration" }, 400);
      }
      const stored: StoredRegistration = {
        ...registration,
        authHash,
        nextMeal: findNextMealReminder(registration.schedule, Date.now()),
        ...(existing?.testAt ? { testAt: existing.testAt } : {})
      };
      await this.save(stored);
      return json({ ok: true });
    }

    if (url.pathname === "/test" && request.method === "POST") {
      if (!existing) return json({ error: "Not registered" }, 404);
      existing.testAt = Date.now() + 10_000;
      await this.save(existing);
      return json({ ok: true, delaySeconds: 10, scheduledAt: existing.testAt });
    }

    return json({ error: "Not found" }, 404);
  }

  private async send(
    subscription: SerializedPushSubscription,
    message: PushMessage,
    notificationType: string
  ): Promise<boolean> {
    try {
      const response = await webPush.sendNotification(
        subscription,
        JSON.stringify(message),
        {
          vapidDetails: {
            subject: this.env.VAPID_SUBJECT,
            publicKey: this.env.VAPID_PUBLIC_KEY,
            privateKey: this.env.VAPID_PRIVATE_KEY
          },
          TTL: 3600,
          urgency: "high"
        }
      );
      console.log(
        JSON.stringify({
          event: "push.accepted",
          notificationType,
          statusCode: response.statusCode
        })
      );
      return true;
    } catch (error) {
      const statusCode = isRecord(error) ? error.statusCode : undefined;
      const responseBody =
        isRecord(error) && typeof error.body === "string"
          ? error.body.slice(0, 500)
          : undefined;
      console.error(
        JSON.stringify({
          event: "push.failed",
          notificationType,
          statusCode:
            typeof statusCode === "number" ? statusCode : undefined,
          message: error instanceof Error ? error.message : "Unknown error",
          responseBody
        })
      );
      if (statusCode === 404 || statusCode === 410) return false;
      throw error;
    }
  }

  async alarm(): Promise<void> {
    const registration = await this.getRegistration();
    if (!registration) return;
    const now = Date.now();
    console.log(
      JSON.stringify({
        event: "alarm.started",
        now,
        testAt: registration.testAt,
        nextMealAt: registration.nextMeal?.runAt
      })
    );

    if (registration.testAt && registration.testAt <= now + 1_000) {
      const delivered = await this.send(
        registration.subscription,
        {
          title: "Crux notifications are working",
          body: "Your 10-second test notification arrived.",
          tag: `crux-test-${registration.testAt}`,
          icon: this.env.APP_ICON_URL,
          url: this.env.APP_URL
        },
        "crux-test"
      );
      if (!delivered) {
        await this.state.storage.deleteAll();
        return;
      }
      delete registration.testAt;
      await this.save(registration);
    }

    if (
      registration.nextMeal &&
      registration.nextMeal.runAt <= now + 1_000
    ) {
      const reminder = registration.nextMeal;
      const delivered = await this.send(
        registration.subscription,
        {
          title: `${reminder.mealLabel} in ${reminder.reminderMinutes} minutes`,
          body: `Planned for ${reminder.mealTime}.`,
          tag: `crux-meal-${reminder.id}`,
          icon: this.env.APP_ICON_URL,
          url: this.env.APP_URL
        },
        "crux-meal"
      );
      if (!delivered) {
        await this.state.storage.deleteAll();
        return;
      }
      registration.nextMeal = findNextMealReminder(
        registration.schedule,
        Math.max(now, reminder.runAt) + 1_000
      );
      await this.save(registration);
    } else {
      await this.setNextAlarm(registration);
    }
  }
}
