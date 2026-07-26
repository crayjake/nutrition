"use client";

import { ArrowLeft, ArrowRight, CalendarClock } from "lucide-react";
import { useState } from "react";
import { MacroRings } from "@/components/macro-rings";
import { MealCard } from "@/components/meal-card";
import { NutritionControls } from "@/components/nutrition-controls";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  getConsumedMacros,
  getMeals,
  getDailyTotals
} from "@/features/nutrition/selectors";
import {
  resolveLogDefaults,
  useTracking
} from "@/features/tracking/tracking-provider";
import { formatDate, shiftDateKey, toLocalDateKey } from "@/lib/dates";
import { WaterTracker } from "./water-tracker";
import { WeightTracker } from "./weight-tracker";

export function TodayPage() {
  const {
    state,
    hydrated,
    toggleMeal,
    setDayPlan,
    setVariant,
    addWater,
    removeLastWater,
    setWeight
  } = useTracking();
  const [date, setDate] = useState(toLocalDateKey);
  const today = toLocalDateKey();

  if (!hydrated) {
    return <div className="loading-card" aria-label="Loading today’s plan" />;
  }

  const log = state.logsByDate[date];
  const { dayPlanId, variantId } = resolveLogDefaults(
    log,
    state.settings.defaultDayPlanId
  );
  const calorieTarget = state.settings.calorieTargets[dayPlanId];
  const meals = getMeals(dayPlanId, variantId, calorieTarget);
  const totals = getDailyTotals(dayPlanId, variantId, calorieTarget);
  const consumedMacros = getConsumedMacros(
    meals,
    log?.completedMealIds ?? []
  );
  const caloriesEaten = Math.round(consumedMacros.energy_kcal);
  const calorieGoal = Math.round(totals.energy_kcal);
  const caloriePercentage =
    calorieGoal > 0 ? (caloriesEaten / calorieGoal) * 100 : 0;
  const displayedCaloriePercentage = Math.round(caloriePercentage);
  const isToday = date === today;

  return (
    <>
      <div className="date-navigation">
        <button
          type="button"
          className="date-arrow"
          aria-label="Previous day"
          onClick={() => setDate(shiftDateKey(date, -1))}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </button>
        <div>
          <p className="eyebrow">{isToday ? "Today" : "Selected day"}</p>
          <h1>{formatDate(date)}</h1>
        </div>
        <button
          type="button"
          className="date-arrow"
          aria-label="Next day"
          onClick={() => setDate(shiftDateKey(date, 1))}
        >
          <ArrowRight aria-hidden="true" size={20} />
        </button>
      </div>
      {!isToday && (
        <button className="today-link" type="button" onClick={() => setDate(today)}>
          <CalendarClock aria-hidden="true" size={16} />
          Back to today
        </button>
      )}

      <NutritionControls
        dayPlanId={dayPlanId}
        variantId={variantId}
        onDayPlanChange={(value) => setDayPlan(date, value)}
        onVariantChange={(value) => setVariant(date, value)}
      />

      <section
        className="summary-card daily-summary-card"
        aria-labelledby="daily-summary"
      >
        <div className="summary-title-row">
          <div>
            <p className="eyebrow muted-on-dark">Daily target</p>
            <h2 id="daily-summary">
              {dayPlanId === "climbing" ? "Climbing fuel" : "Rest day fuel"}
            </h2>
          </div>
          <span className="variant-pill">
            {variantId === "default" ? "Tofu" : "Chicken"}
          </span>
        </div>
        <MacroRings consumed={consumedMacros} goals={totals} />
        <div className="completion-row">
          <span>
            <strong>{caloriesEaten.toLocaleString("en-GB")}</strong> of{" "}
            {calorieGoal.toLocaleString("en-GB")} kcal
          </span>
          <strong>{displayedCaloriePercentage}%</strong>
        </div>
        <ProgressBar
          value={caloriePercentage}
          label={`Calories eaten: ${caloriesEaten} of ${calorieGoal} kilocalories`}
          tone={caloriePercentage >= 100 ? "success" : "accent"}
        />
      </section>

      <h2 className="section-title">Today’s meals</h2>
      <div className="meal-list">
        {meals.map((meal) => (
          <MealCard
            meal={meal}
            time={
              state.settings.mealTimings[dayPlanId][meal.meal_instance_id]
                ?.time
            }
            completed={log?.completedMealIds.includes(meal.meal_instance_id)}
            onToggle={() =>
              toggleMeal(date, meal.meal_instance_id, dayPlanId, variantId)
            }
            key={meal.meal_instance_id}
          />
        ))}
      </div>

      <h2 className="section-title">Daily check-in</h2>
      <div className="tracker-stack">
        <WaterTracker
          date={date}
          log={log}
          goal={state.settings.waterGoalMl}
          fallbackPlan={dayPlanId}
          fallbackVariant={variantId}
          addWater={addWater}
          removeLast={removeLastWater}
        />
        <WeightTracker
          key={`${date}-${log?.weightKg ?? "none"}`}
          date={date}
          weightKg={log?.weightKg}
          fallbackPlan={dayPlanId}
          fallbackVariant={variantId}
          onSave={setWeight}
        />
      </div>
    </>
  );
}
