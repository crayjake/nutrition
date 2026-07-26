"use client";

import { Download, HardDrive, ShieldCheck, Trash2, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useTracking } from "./tracking-provider";
import { createBackup, parseBackup } from "./storage";
import type { DayPlanId } from "@/types/nutrition";
import type {
  AppState,
  ColourScheme,
  ThemePreference
} from "@/types/tracking";

const COLOUR_SCHEMES: Array<{
  value: ColourScheme;
  label: string;
  description: string;
  colours: [string, string, string];
}> = [
  {
    value: "ember",
    label: "Ember",
    description: "Warm terracotta",
    colours: ["#dd5e38", "#73c79d", "#71bde0"]
  },
  {
    value: "forest",
    label: "Forest",
    description: "Calm climbing green",
    colours: ["#3b8558", "#e6bb58", "#71bde0"]
  },
  {
    value: "ocean",
    label: "Ocean",
    description: "Cool, clear blue",
    colours: ["#347fa8", "#73c79d", "#e6bb58"]
  },
  {
    value: "berry",
    label: "Berry",
    description: "Soft purple rose",
    colours: ["#a05282", "#71bde0", "#e6bb58"]
  }
];

export function SettingsPage() {
  const {
    state,
    hydrated,
    storageAvailable,
    updateSettings,
    replaceState,
    resetState
  } = useTracking();
  const [waterGoal, setWaterGoal] = useState(String(state.settings.waterGoalMl));
  const [goalError, setGoalError] = useState("");
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [status, setStatus] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  if (!hydrated) {
    return <div className="loading-card" aria-label="Loading settings" />;
  }

  function saveWaterGoal(event: FormEvent) {
    event.preventDefault();
    const value = Number(waterGoal);
    if (!Number.isFinite(value) || value < 250 || value > 10000) {
      setGoalError("Choose a goal between 250 and 10,000 ml.");
      return;
    }
    updateSettings({ waterGoalMl: Math.round(value) });
    setWaterGoal(String(Math.round(value)));
    setGoalError("");
    setStatus("Water goal saved.");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(createBackup(state), null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crux-nutrition-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Backup exported.");
  }

  async function readImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const backup = parseBackup(await file.text());
    if (!backup) {
      setPendingImport(null);
      setStatus("That file is not a valid Crux backup.");
      return;
    }
    setPendingImport(backup.data);
    setStatus("Valid backup ready to import. Confirm below.");
  }

  function confirmImport() {
    if (!pendingImport) return;
    replaceState(pendingImport);
    setPendingImport(null);
    if (fileInput.current) fileInput.current.value = "";
    setWaterGoal(String(pendingImport.settings.waterGoalMl));
    setStatus("Backup imported. Existing local data was replaced.");
  }

  function confirmClear() {
    resetState();
    setWaterGoal("2500");
    setConfirmReset(false);
    setStatus("All tracking data and preferences were reset.");
  }

  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Personalise</p>
          <h1>Settings</h1>
          <p>Your preferences and tracking data stay in this browser.</p>
        </div>
      </header>

      {!storageAvailable && (
        <div className="notice warning" role="status">
          Browser storage is unavailable. Changes will work for this session only.
        </div>
      )}

      <section className="settings-section" aria-labelledby="appearance-heading">
        <div className="settings-heading">
          <h2 id="appearance-heading">Appearance</h2>
          <p>Pick an accent palette, then choose light or dark mode.</p>
        </div>
        <div className="colour-scheme-grid" aria-label="Colour scheme">
          {COLOUR_SCHEMES.map((scheme) => (
            <button
              className="colour-scheme-option"
              data-active={state.settings.colourScheme === scheme.value}
              aria-pressed={state.settings.colourScheme === scheme.value}
              key={scheme.value}
              type="button"
              onClick={() =>
                updateSettings({ colourScheme: scheme.value })
              }
            >
              <span className="colour-scheme-swatch" aria-hidden="true">
                {scheme.colours.map((colour) => (
                  <span key={colour} style={{ backgroundColor: colour }} />
                ))}
              </span>
              <span>
                <strong>{scheme.label}</strong>
                <small>{scheme.description}</small>
              </span>
            </button>
          ))}
        </div>
        <SegmentedControl
          label="Brightness"
          value={state.settings.theme}
          onChange={(theme: ThemePreference) => updateSettings({ theme })}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" }
          ]}
        />
      </section>

      <section className="settings-section" aria-labelledby="tracking-heading">
        <div className="settings-heading">
          <h2 id="tracking-heading">Tracking preferences</h2>
          <p>Used when a date has no check-in yet.</p>
        </div>
        <label className="input-label" htmlFor="water-goal">Daily water goal (ml)</label>
        <form className="inline-form" onSubmit={saveWaterGoal}>
          <div>
            <input
              className="input"
              id="water-goal"
              type="number"
              min="250"
              max="10000"
              step="50"
              inputMode="numeric"
              value={waterGoal}
              aria-invalid={Boolean(goalError)}
              aria-describedby={goalError ? "goal-error" : undefined}
              onChange={(event) => setWaterGoal(event.target.value)}
            />
          </div>
          <button className="button" type="submit">Save</button>
        </form>
        {goalError && <p className="field-error" id="goal-error">{goalError}</p>}
        <div className="setting-control">
          <span className="input-label">Default day for new dates</span>
          <SegmentedControl
            label="Default day plan"
            value={state.settings.defaultDayPlanId}
            onChange={(defaultDayPlanId: DayPlanId) =>
              updateSettings({ defaultDayPlanId })
            }
            options={[
              { value: "climbing", label: "Climbing" },
              { value: "rest", label: "Rest" }
            ]}
          />
        </div>
      </section>

      <section className="settings-section" aria-labelledby="data-heading">
        <div className="settings-heading">
          <h2 id="data-heading">Local data</h2>
          <p>Export a portable backup or restore one from this app.</p>
        </div>
        <div className="privacy-note">
          <ShieldCheck aria-hidden="true" size={20} />
          <span>
            No account, cloud sync or analytics. Your check-ins never leave this device
            unless you export them.
          </span>
        </div>
        <div className="data-actions">
          <button className="button" type="button" onClick={exportData}>
            <Download aria-hidden="true" size={18} />
            Export backup
          </button>
          <label className="button upload-button">
            <Upload aria-hidden="true" size={18} />
            Choose backup
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={readImport}
            />
          </label>
        </div>
        {pendingImport && (
          <div className="confirm-panel">
            <div>
              <HardDrive aria-hidden="true" size={20} />
              <strong>Replace existing local data?</strong>
              <p>This valid backup will overwrite all current check-ins and preferences.</p>
            </div>
            <div className="confirm-actions">
              <button className="button" type="button" onClick={() => setPendingImport(null)}>
                Cancel
              </button>
              <button className="button button-primary" type="button" onClick={confirmImport}>
                Replace data
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="settings-section danger-zone" aria-labelledby="reset-heading">
        <div className="settings-heading">
          <h2 id="reset-heading">Reset everything</h2>
          <p>Remove every check-in and return preferences to their defaults.</p>
        </div>
        {!confirmReset ? (
          <button className="button button-danger" type="button" onClick={() => setConfirmReset(true)}>
            <Trash2 aria-hidden="true" size={18} />
            Reset local data
          </button>
        ) : (
          <div className="confirm-panel">
            <div>
              <strong>This cannot be undone.</strong>
              <p>Export a backup first if you might need these records again.</p>
            </div>
            <div className="confirm-actions">
              <button className="button" type="button" onClick={() => setConfirmReset(false)}>
                Keep data
              </button>
              <button className="button button-danger" type="button" onClick={confirmClear}>
                Yes, reset everything
              </button>
            </div>
          </div>
        )}
      </section>
      <p className="save-status" aria-live="polite">{status}</p>
    </>
  );
}
