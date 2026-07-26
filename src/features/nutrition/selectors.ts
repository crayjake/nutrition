import { nutritionPlan } from "@/data/nutrition";
import { adjustPlanToCalories } from "./calorie-targets";
import type {
  DayPlanId,
  DerivedMeal,
  DerivedMealItem,
  DerivedPlan,
  VariantId
} from "@/types/nutrition";

export function resolveDayPlan(
  dayPlanId: DayPlanId,
  variantId: VariantId,
  calorieTarget?: number
): DerivedPlan {
  return calorieTarget === undefined
    ? nutritionPlan.day_plans[dayPlanId].derived[variantId]
    : adjustPlanToCalories(dayPlanId, variantId, calorieTarget);
}

export function getMeals(
  dayPlanId: DayPlanId,
  variantId: VariantId,
  calorieTarget?: number
): DerivedMeal[] {
  return resolveDayPlan(dayPlanId, variantId, calorieTarget).meals;
}

export function getMeal(
  dayPlanId: DayPlanId,
  variantId: VariantId,
  mealId: string,
  calorieTarget?: number
): DerivedMeal | undefined {
  return getMeals(dayPlanId, variantId, calorieTarget).find(
    (meal) => meal.meal_instance_id === mealId
  );
}

export function getIngredientName(item: DerivedMealItem): string {
  return nutritionPlan.products[item.ingredient_id]?.name ?? item.ingredient_id;
}

export function getDailyTotals(
  dayPlanId: DayPlanId,
  variantId: VariantId,
  calorieTarget?: number
) {
  return resolveDayPlan(dayPlanId, variantId, calorieTarget).totals;
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

const ZERO_MACROS = {
  energy_kcal: 0,
  protein_g: 0,
  carbohydrate_g: 0,
  fat_g: 0,
  fibre_g: 0,
  sugars_g: 0,
  salt_g: 0
};

export function getConsumedMacros(
  meals: DerivedMeal[],
  completedMealIds: string[]
) {
  const completed = new Set(completedMealIds);
  return meals.reduce(
    (total, meal) => {
      if (!completed.has(meal.meal_instance_id)) return total;
      for (const key of Object.keys(total) as Array<keyof typeof total>) {
        total[key] += meal.totals[key];
      }
      return total;
    },
    { ...ZERO_MACROS }
  );
}
