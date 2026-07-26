"use client";

import { shiftDateKey, toLocalDateKey } from "@/lib/dates";
import type {
  NotificationRegistration,
  ReminderSchedule,
  SerializedPushSubscription
} from "@/types/notifications";
import type { AppState } from "@/types/tracking";

const PUSH_REGISTRATION_KEY = "crux-push-registration:v1";
const PUSH_API_URL = process.env.NEXT_PUBLIC_PUSH_API_URL?.replace(/\/$/, "");

interface LocalPushRegistration {
  installationId: string;
  authToken: string;
  lastSchedule?: string;
}

export type PushConnectionStatus =
  | "checking"
  | "ready"
  | "enabled"
  | "denied"
  | "unsupported"
  | "unavailable";

export class PushApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

function supportsPush(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function getAppBasePath(): string {
  const manifest = document.querySelector<HTMLLinkElement>(
    'link[rel="manifest"]'
  );
  if (!manifest) return "";
  const pathname = new URL(manifest.href, window.location.href).pathname;
  return pathname.replace(/\/manifest\.webmanifest$/, "");
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const basePath = getAppBasePath();
  return navigator.serviceWorker.register(`${basePath}/sw.js`, {
    scope: `${basePath}/`
  });
}

function readLocalRegistration(): LocalPushRegistration | null {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(PUSH_REGISTRATION_KEY) ?? "null"
    );
    if (
      typeof value !== "object" ||
      value === null ||
      !("installationId" in value) ||
      !("authToken" in value) ||
      typeof value.installationId !== "string" ||
      typeof value.authToken !== "string"
    ) {
      return null;
    }
    return value as LocalPushRegistration;
  } catch {
    return null;
  }
}

function writeLocalRegistration(registration: LocalPushRegistration): void {
  localStorage.setItem(PUSH_REGISTRATION_KEY, JSON.stringify(registration));
}

function clearLocalRegistration(): void {
  localStorage.removeItem(PUSH_REGISTRATION_KEY);
}

function randomBase64Url(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createLocalRegistration(): LocalPushRegistration {
  return {
    installationId: randomBase64Url(18),
    authToken: randomBase64Url(32)
  };
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function apiRequest(
  path: string,
  init: RequestInit = {}
): Promise<Record<string, unknown>> {
  if (!PUSH_API_URL) {
    throw new PushApiError("Notification service is not configured.", 503);
  }
  const response = await fetch(`${PUSH_API_URL}${path}`, init);
  const result = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    throw new PushApiError(
      typeof result.error === "string"
        ? result.error
        : "Notification service request failed.",
      response.status
    );
  }
  return result;
}

function serializeSubscription(
  subscription: PushSubscription
): SerializedPushSubscription {
  const value = subscription.toJSON();
  if (!value.endpoint || !value.keys?.auth || !value.keys.p256dh) {
    throw new Error("The browser returned an incomplete push subscription.");
  }
  return {
    endpoint: value.endpoint,
    expirationTime: value.expirationTime ?? null,
    keys: {
      auth: value.keys.auth,
      p256dh: value.keys.p256dh
    }
  };
}

export function createReminderSchedule(state: AppState): ReminderSchedule {
  const today = toLocalDateKey();
  const finalDate = shiftDateKey(today, 60);
  const dayPlanOverrides = Object.fromEntries(
    Object.entries(state.logsByDate)
      .filter(([date]) => date >= today && date <= finalDate)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, log]) => [date, log.dayPlanId])
  );
  return {
    timeZone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London",
    defaultDayPlanId: state.settings.defaultDayPlanId,
    dayPlanOverrides,
    mealTimings: state.settings.mealTimings
  };
}

async function postRegistration(
  localRegistration: LocalPushRegistration,
  subscription: PushSubscription,
  state: AppState,
  pairingCode?: string
): Promise<string> {
  const schedule = createReminderSchedule(state);
  const scheduleJson = JSON.stringify(schedule);
  const body: NotificationRegistration = {
    subscription: serializeSubscription(subscription),
    schedule
  };
  const headers: Record<string, string> = {
    Authorization: `Bearer ${localRegistration.authToken}`,
    "Content-Type": "application/json"
  };
  if (pairingCode) headers["X-Pairing-Code"] = pairingCode;
  await apiRequest(
    `/installations/${localRegistration.installationId}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    }
  );
  return scheduleJson;
}

export async function getPushConnectionStatus(): Promise<PushConnectionStatus> {
  if (!PUSH_API_URL) return "unavailable";
  if (!supportsPush()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const localRegistration = readLocalRegistration();
  const serviceWorker = await getServiceWorkerRegistration();
  const subscription = await serviceWorker.pushManager.getSubscription();
  return localRegistration && subscription ? "enabled" : "ready";
}

export async function enablePushNotifications(
  pairingCode: string,
  state: AppState
): Promise<void> {
  if (!supportsPush()) {
    throw new Error("Push notifications are not supported on this device.");
  }
  const permission =
    Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const serviceWorker = await getServiceWorkerRegistration();
  const { publicKey } = await apiRequest("/vapid-public-key");
  if (typeof publicKey !== "string") {
    throw new Error("The notification service returned an invalid key.");
  }
  const existingSubscription =
    await serviceWorker.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await serviceWorker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    }));
  const localRegistration =
    readLocalRegistration() ?? createLocalRegistration();

  try {
    const lastSchedule = await postRegistration(
      localRegistration,
      subscription,
      state,
      pairingCode
    );
    writeLocalRegistration({ ...localRegistration, lastSchedule });
  } catch (error) {
    if (!existingSubscription) await subscription.unsubscribe();
    if (error instanceof PushApiError && error.status === 401) {
      clearLocalRegistration();
    }
    throw error;
  }
}

export async function syncPushSchedule(
  state: AppState,
  force = false
): Promise<boolean> {
  if (!PUSH_API_URL || !supportsPush()) return false;
  const localRegistration = readLocalRegistration();
  if (!localRegistration || Notification.permission !== "granted") {
    return false;
  }
  const scheduleJson = JSON.stringify(createReminderSchedule(state));
  if (!force && localRegistration.lastSchedule === scheduleJson) return true;

  const serviceWorker = await getServiceWorkerRegistration();
  const subscription = await serviceWorker.pushManager.getSubscription();
  if (!subscription) return false;

  try {
    await postRegistration(localRegistration, subscription, state);
    writeLocalRegistration({ ...localRegistration, lastSchedule: scheduleJson });
    return true;
  } catch (error) {
    if (
      error instanceof PushApiError &&
      (error.status === 401 || error.status === 404)
    ) {
      clearLocalRegistration();
    }
    throw error;
  }
}

export async function scheduleTestNotification(
  state: AppState
): Promise<void> {
  await syncPushSchedule(state, true);
  const localRegistration = readLocalRegistration();
  if (!localRegistration) throw new Error("Notifications are not connected.");
  await apiRequest(
    `/installations/${localRegistration.installationId}/test`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localRegistration.authToken}`,
        "Content-Type": "application/json"
      },
      body: "{}"
    }
  );
}

export async function disablePushNotifications(): Promise<void> {
  if (!supportsPush()) {
    clearLocalRegistration();
    return;
  }
  const localRegistration = readLocalRegistration();
  if (localRegistration && PUSH_API_URL) {
    try {
      await apiRequest(
        `/installations/${localRegistration.installationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localRegistration.authToken}`
          }
        }
      );
    } catch {
      // Unsubscribing locally still prevents future delivery to this device.
    }
  }
  const serviceWorker = await getServiceWorkerRegistration();
  const subscription = await serviceWorker.pushManager.getSubscription();
  await subscription?.unsubscribe();
  clearLocalRegistration();
}
