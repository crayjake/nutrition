import { nutritionPlan } from "@/data/nutrition";
import type {
  DayPlanId,
  DerivedMeal,
  DerivedMealItem,
  DerivedPlan,
  VariantId
} from "@/types/nutrition";

export function resolveDayPlan(
  dayPlanId: DayPlanId,
  variantId: VariantId
): DerivedPlan {
  return nutritionPlan.day_plans[dayPlanId].derived[variantId];
}

export function getMeals(
  dayPlanId: DayPlanId,
  variantId: VariantId
): DerivedMeal[] {
  return resolveDayPlan(dayPlanId, variantId).meals;
}

export function getMeal(
  dayPlanId: DayPlanId,
  variantId: VariantId,
  mealId: string
): DerivedMeal | undefined {
  return getMeals(dayPlanId, variantId).find(
    (meal) => meal.meal_instance_id === mealId
  );
}

export function getIngredientName(item: DerivedMealItem): string {
  return nutritionPlan.products[item.ingredient_id]?.name ?? item.ingredient_id;
}

export function getDailyTotals(
  dayPlanId: DayPlanId,
  variantId: VariantId
) {
  return resolveDayPlan(dayPlanId, variantId).totals;
}

export function getValidMealIds(
  dayPlanId: DayPlanId,
  variantId: VariantId
): Set<string> {
  return new Set(
    getMeals(dayPlanId, variantId).map((meal) => meal.meal_instance_id)
  );
}

export function completionPercentage(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(completed, total) / total) * 100);
}
