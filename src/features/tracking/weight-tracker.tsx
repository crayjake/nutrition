"use client";

import { Scale, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import type { DayPlanId, VariantId } from "@/types/nutrition";

export function WeightTracker({
  date,
  weightKg,
  fallbackPlan,
  fallbackVariant,
  onSave
}: {
  date: string;
  weightKg?: number;
  fallbackPlan: DayPlanId;
  fallbackVariant: VariantId;
  onSave: (
    date: string,
    weight: number | undefined,
    plan: DayPlanId,
    variant: VariantId
  ) => void;
}) {
  const [value, setValue] = useState(weightKg?.toString() ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 25 || parsed > 400) {
      setError("Enter a weight between 25 and 400 kg.");
      return;
    }
    onSave(date, parsed, fallbackPlan, fallbackVariant);
    setError("");
  }

  function remove() {
    onSave(date, undefined, fallbackPlan, fallbackVariant);
    setValue("");
    setError("");
  }

  return (
    <section className="surface-card tracker-card" aria-labelledby="weight-title">
      <div className="tracker-heading">
        <div className="tracker-icon weight-icon" aria-hidden="true">
          <Scale size={20} />
        </div>
        <div>
          <h2 id="weight-title">Weight</h2>
          <p>{weightKg ? `${weightKg.toFixed(1)} kg recorded` : "Optional daily check-in"}</p>
        </div>
      </div>
      <form className="inline-form weight-form" onSubmit={submit}>
        <div>
          <label className="sr-only" htmlFor="daily-weight">
            Weight in kilograms
          </label>
          <input
            className="input"
            id="daily-weight"
            type="number"
            min="25"
            max="400"
            step="0.1"
            inputMode="decimal"
            placeholder="e.g. 72.4 kg"
            value={value}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "weight-error" : undefined}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <button className="button" type="submit">
          {weightKg ? "Update" : "Save"}
        </button>
        {weightKg && (
          <button
            className="button icon-only button-danger"
            type="button"
            aria-label="Remove weight entry"
            onClick={remove}
          >
            <Trash2 aria-hidden="true" size={18} />
          </button>
        )}
      </form>
      {error && (
        <p className="field-error" id="weight-error">
          {error}
        </p>
      )}
    </section>
  );
}
