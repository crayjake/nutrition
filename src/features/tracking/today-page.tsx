"use client";

import { ArrowLeft, ArrowRight, CalendarClock } from "lucide-react";
import { useState } from "react";
import { MacroSummary } from "@/components/macro-summary";
import { MealCard } from "@/components/meal-card";
import { NutritionControls } from "@/components/nutrition-controls";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  completionPercentage,
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
  const meals = getMeals(dayPlanId, variantId);
  const totals = getDailyTotals(dayPlanId, variantId);
  const completed = log?.completedMealIds.filter((id) =>
    meals.some((meal) => meal.meal_instance_id === id)
  ).length ?? 0;
  const percentage = completionPercentage(completed, meals.length);
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

      <section className="summary-card" aria-labelledby="daily-summary">
        <div className="summary-title-row">
          <div>
            <p className="eyebrow muted-on-dark">Daily target</p>
            <h2 id="daily-summary">{dayPlanId === "climbing" ? "Climbing fuel" : "Rest day fuel"}</h2>
          </div>
          <span className="variant-pill">
            {variantId === "default" ? "Tofu" : "Chicken"}
          </span>
        </div>
        <MacroSummary totals={totals} />
        <div className="completion-row">
          <span>
            <strong>{completed} of {meals.length}</strong> meals complete
          </span>
          <strong>{percentage}%</strong>
        </div>
        <ProgressBar
          value={percentage}
          label={`${completed} of ${meals.length} meals complete`}
          tone={percentage === 100 ? "success" : "accent"}
        />
      </section>

      <h2 className="section-title">Today’s meals</h2>
      <div className="meal-list">
        {meals.map((meal) => (
          <MealCard
            meal={meal}
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
