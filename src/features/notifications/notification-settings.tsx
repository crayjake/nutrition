"use client";

import { BellOff, BellRing, Bug, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTracking } from "@/features/tracking/tracking-provider";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushConnectionStatus,
  scheduleTestNotification,
  type PushConnectionStatus
} from "./push-client";

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong while configuring notifications.";
}

export function NotificationSettings() {
  const { state } = useTracking();
  const [connection, setConnection] =
    useState<PushConnectionStatus>("checking");
  const [pairingCode, setPairingCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getPushConnectionStatus()
      .then((status) => {
        if (active) setConnection(status);
      })
      .catch((error) => {
        if (active) {
          setConnection("ready");
          setMessage(errorMessage(error));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      await enablePushNotifications(pairingCode.trim().toUpperCase(), state);
      setConnection("enabled");
      setPairingCode("");
      setMessage("Background meal reminders are enabled on this device.");
    } catch (error) {
      setMessage(errorMessage(error));
      setConnection(
        typeof Notification !== "undefined" &&
          Notification.permission === "denied"
          ? "denied"
          : "ready"
      );
    } finally {
      setBusy(false);
    }
  }

  async function testNotification() {
    setBusy(true);
    setMessage("");
    try {
      await scheduleTestNotification(state);
      setMessage(
        "Test scheduled. It should arrive in about 10 seconds, even if you close the app."
      );
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage("");
    await disablePushNotifications();
    setConnection("ready");
    setBusy(false);
    setMessage("Background reminders disabled on this device.");
  }

  if (connection === "checking") {
    return (
      <div className="notification-panel" aria-label="Checking notifications">
        <LoaderCircle className="spin" aria-hidden="true" size={20} />
        <span>Checking notification support…</span>
      </div>
    );
  }

  if (connection === "unavailable") {
    return (
      <div className="notification-panel">
        <BellOff aria-hidden="true" size={20} />
        <span>
          <strong>Notification service is not connected in this build.</strong>
          Meal times and reminder choices are still saved locally.
        </span>
      </div>
    );
  }

  if (connection === "unsupported") {
    return (
      <div className="notification-panel">
        <BellOff aria-hidden="true" size={20} />
        <span>
          <strong>This browser cannot receive background notifications.</strong>
          On iPhone, open the installed Home Screen version of Crux.
        </span>
      </div>
    );
  }

  if (connection === "denied") {
    return (
      <div className="notification-panel">
        <BellOff aria-hidden="true" size={20} />
        <span>
          <strong>Notifications are blocked.</strong>
          Allow Crux in iPhone Settings → Notifications, then reopen the app.
        </span>
      </div>
    );
  }

  return (
    <div className="notification-panel" data-enabled={connection === "enabled"}>
      <BellRing aria-hidden="true" size={20} />
      <div className="notification-panel-content">
        <strong>
          {connection === "enabled"
            ? "Background reminders enabled"
            : "Enable iPhone notifications"}
        </strong>
        {connection === "ready" ? (
          <>
            <p>
              Enter the one-time setup code, then accept the iPhone permission
              prompt.
            </p>
            <label>
              <span className="input-label">Notification setup code</span>
              <input
                className="input"
                type="text"
                autoCapitalize="characters"
                autoComplete="one-time-code"
                spellCheck={false}
                value={pairingCode}
                onChange={(event) =>
                  setPairingCode(event.target.value.toUpperCase())
                }
              />
            </label>
            <button
              className="button button-primary"
              type="button"
              disabled={busy || pairingCode.trim().length < 8}
              onClick={enable}
            >
              {busy ? "Connecting…" : "Enable notifications"}
            </button>
          </>
        ) : (
          <div className="notification-actions">
            <button
              className="button button-primary"
              type="button"
              disabled={busy}
              onClick={testNotification}
            >
              <Bug aria-hidden="true" size={17} />
              {busy ? "Scheduling…" : "Send test in 10 seconds"}
            </button>
            <button
              className="button"
              type="button"
              disabled={busy}
              onClick={disable}
            >
              Disable
            </button>
          </div>
        )}
        {message && (
          <p className="notification-message" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
