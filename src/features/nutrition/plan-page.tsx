"use client";

import { useState } from "react";
import { MacroSummary } from "@/components/macro-summary";
import { MealCard } from "@/components/meal-card";
import { NutritionControls } from "@/components/nutrition-controls";
import { useTracking } from "@/features/tracking/tracking-provider";
import { getMeals, getDailyTotals } from "./selectors";
import type { DayPlanId, VariantId } from "@/types/nutrition";

export function PlanPage() {
  const [dayPlanId, setDayPlanId] = useState<DayPlanId>("climbing");
  const [variantId, setVariantId] = useState<VariantId>("default");
  const { state } = useTracking();
  const calorieTarget = state.settings.calorieTargets[dayPlanId];
  const meals = getMeals(dayPlanId, variantId, calorieTarget);
  const totals = getDailyTotals(dayPlanId, variantId, calorieTarget);

  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Reference</p>
          <h1>Nutrition plan</h1>
          <p>Explore the supplied plan. Quantities and nutrition are read-only.</p>
        </div>
      </header>
      <NutritionControls
        dayPlanId={dayPlanId}
        variantId={variantId}
        onDayPlanChange={setDayPlanId}
        onVariantChange={setVariantId}
      />
      <section className="summary-card plan-summary" aria-labelledby="plan-total">
        <div className="summary-title-row">
          <div>
            <p className="eyebrow muted-on-dark">Plan total</p>
            <h2 id="plan-total">
              {dayPlanId === "climbing" ? "Climbing day" : "Rest day"}
            </h2>
          </div>
          <span className="variant-pill">
            {variantId === "default" ? "Default tofu" : "Optional chicken"}
          </span>
        </div>
        <MacroSummary totals={totals} />
      </section>
      <div className="plan-note">
        <strong>{variantId === "default" ? "Default protein" : "Optional swap"}</strong>
        <span>
          {variantId === "default"
            ? "Tofu is the canonical default for the pasta meal."
            : "Chicken is shown at its supplied cooked weight."}
        </span>
      </div>
      <h2 className="section-title">{meals.length} meals</h2>
      <div className="meal-list">
        {meals.map((meal) => (
          <MealCard
            readOnly
            meal={meal}
            time={
              state.settings.mealTimings[dayPlanId][meal.meal_instance_id]
                ?.time
            }
            key={meal.meal_instance_id}
          />
        ))}
      </div>
    </>
  );
}
