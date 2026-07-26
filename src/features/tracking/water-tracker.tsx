"use client";

import { Droplets, RotateCcw } from "lucide-react";
import { FormEvent, useState } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { waterTotal } from "./progress";
import type { DayPlanId, VariantId } from "@/types/nutrition";
import type { DailyLog } from "@/types/tracking";

export function WaterTracker({
  date,
  log,
  goal,
  fallbackPlan,
  fallbackVariant,
  addWater,
  removeLast
}: {
  date: string;
  log?: DailyLog;
  goal: number;
  fallbackPlan: DayPlanId;
  fallbackVariant: VariantId;
  addWater: (
    date: string,
    amount: number,
    plan: DayPlanId,
    variant: VariantId
  ) => void;
  removeLast: (date: string) => void;
}) {
  const [customAmount, setCustomAmount] = useState("");
  const total = waterTotal(log);
  const litres = total / 1000;

  function submitCustom(event: FormEvent) {
    event.preventDefault();
    const amount = Number(customAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 5000) return;
    addWater(date, amount, fallbackPlan, fallbackVariant);
    setCustomAmount("");
  }

  return (
    <section className="surface-card tracker-card" aria-labelledby="water-title">
      <div className="tracker-heading">
        <div className="tracker-icon water-icon" aria-hidden="true">
          <Droplets size={20} />
        </div>
        <div>
          <h2 id="water-title">Water</h2>
          <p>
            <strong>{total.toLocaleString("en-GB")} ml</strong>
            <span> · {litres.toFixed(litres % 1 === 0 ? 0 : 1)} L</span>
          </p>
        </div>
        <span className="goal-label">{Math.round((total / goal) * 100)}%</span>
      </div>
      <ProgressBar
        value={(total / goal) * 100}
        label={`${total} of ${goal} millilitres`}
        tone="water"
      />
      <p className="tracker-goal">{goal.toLocaleString("en-GB")} ml daily goal</p>
      <div className="quick-actions">
        <button
          type="button"
          className="button button-subtle"
          onClick={() => addWater(date, 250, fallbackPlan, fallbackVariant)}
        >
          + 250 ml
        </button>
        <button
          type="button"
          className="button button-subtle"
          onClick={() => addWater(date, 500, fallbackPlan, fallbackVariant)}
        >
          + 500 ml
        </button>
        <button
          type="button"
          className="button icon-action"
          disabled={!log?.waterEntries.length}
          onClick={() => removeLast(date)}
          aria-label="Undo last water entry"
        >
          <RotateCcw aria-hidden="true" size={17} />
          <span>Undo</span>
        </button>
      </div>
      <form className="inline-form" onSubmit={submitCustom}>
        <div>
          <label className="sr-only" htmlFor="custom-water">
            Custom water quantity in millilitres
          </label>
          <input
            className="input"
            id="custom-water"
            min="1"
            max="5000"
            inputMode="numeric"
            placeholder="Custom ml"
            type="number"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
          />
        </div>
        <button className="button" type="submit">
          Add
        </button>
      </form>
    </section>
  );
}
