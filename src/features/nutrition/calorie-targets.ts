import { nutritionPlan } from "@/data/nutrition";
import type {
  Amount,
  CalorieTargets,
  DayPlanId,
  DerivedMeal,
  DerivedMealItem,
  DerivedPlan,
  Macros,
  VariantId
} from "@/types/nutrition";

export const DEFAULT_CALORIE_TARGETS: CalorieTargets = {
  climbing: 2200,
  rest: 1900
};

export const CALORIE_TARGET_LIMITS: Record<
  DayPlanId,
  { min: number; max: number }
> = {
  climbing: { min: 1900, max: 2750 },
  rest: { min: 1650, max: 2550 }
};

const MACRO_KEYS: Array<keyof Macros> = [
  "energy_kcal",
  "protein_g",
  "carbohydrate_g",
  "fat_g",
  "fibre_g",
  "sugars_g",
  "salt_g"
];

interface AdjustableItem {
  mealIndex: number;
  itemIndex: number;
  baseAmount: number;
  min: number;
  max: number;
  step: number;
  priority: number;
  item: DerivedMealItem;
}

interface AdjustmentState {
  energy: number;
  penalty: number;
  amounts: number[];
}

const adjustedPlanCache = new Map<string, DerivedPlan>();

function round(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function sumMacros(macros: Macros[]): Macros {
  return MACRO_KEYS.reduce(
    (totals, key) => {
      totals[key] = round(macros.reduce((sum, item) => sum + item[key], 0));
      return totals;
    },
    {
      energy_kcal: 0,
      protein_g: 0,
      carbohydrate_g: 0,
      fat_g: 0,
      fibre_g: 0,
      sugars_g: 0,
      salt_g: 0
    }
  );
}

function scaleMacros(item: DerivedMealItem, amount: number): Macros {
  if (amount === item.amount.value) return item.macros;
  const ratio = amount / item.amount.value;
  return MACRO_KEYS.reduce(
    (macros, key) => {
      macros[key] = round(item.macros[key] * ratio);
      return macros;
    },
    {
      energy_kcal: 0,
      protein_g: 0,
      carbohydrate_g: 0,
      fat_g: 0,
      fibre_g: 0,
      sugars_g: 0,
      salt_g: 0
    }
  );
}

function getAdjustableItems(
  dayPlanId: DayPlanId,
  plan: DerivedPlan
): AdjustableItem[] {
  const dayPlan = nutritionPlan.day_plans[dayPlanId];
  return dayPlan.target_adjustment.adjustable_order.flatMap(
    (path, priority) => {
      const [mealId, componentId] = path.split(".");
      const mealIndex = plan.meals.findIndex(
        (meal) => meal.meal_instance_id === mealId
      );
      if (mealIndex < 0) return [];
      const meal = plan.meals[mealIndex];
      const itemIndex = meal.items.findIndex(
        (item) => item.component_id === componentId
      );
      if (itemIndex < 0) return [];
      const item = meal.items[itemIndex];
      const component = nutritionPlan.meal_templates[
        meal.template_id
      ]?.components.find((candidate) => candidate.id === componentId);
      const scaling = component?.scaling;
      if (
        scaling?.mode !== "adjustable" ||
        scaling.min === undefined ||
        scaling.max === undefined ||
        scaling.step === undefined
      ) {
        return [];
      }
      const positiveMinimum = Math.max(scaling.min, scaling.step);
      return [
        {
          mealIndex,
          itemIndex,
          baseAmount: item.amount.value,
          min: positiveMinimum,
          max: scaling.max,
          step: scaling.step,
          priority,
          item
        }
      ];
    }
  );
}

function candidateAmounts(item: AdjustableItem): number[] {
  const values = new Set<number>([
    item.baseAmount,
    item.min,
    item.max
  ]);
  for (
    let amount = item.baseAmount - item.step;
    amount >= item.min;
    amount -= item.step
  ) {
    values.add(round(amount, 3));
  }
  for (
    let amount = item.baseAmount + item.step;
    amount <= item.max;
    amount += item.step
  ) {
    values.add(round(amount, 3));
  }
  return [...values]
    .filter((amount) => amount > 0 && amount >= item.min && amount <= item.max)
    .sort((left, right) => left - right);
}

function selectAmounts(
  plan: DerivedPlan,
  adjustableItems: AdjustableItem[],
  targetCalories: number
): number[] {
  const adjustableBaseCalories = adjustableItems.reduce(
    (sum, item) => sum + item.item.macros.energy_kcal,
    0
  );
  const fixedCalories = plan.totals.energy_kcal - adjustableBaseCalories;
  let states = new Map<number, AdjustmentState>([
    [0, { energy: 0, penalty: 0, amounts: [] }]
  ]);

  adjustableItems.forEach((item) => {
    const next = new Map<number, AdjustmentState>();
    for (const state of states.values()) {
      for (const amount of candidateAmounts(item)) {
        const energy =
          state.energy +
          item.item.macros.energy_kcal * (amount / item.baseAmount);
        const key = Math.round(energy * 10);
        const steps = Math.abs(amount - item.baseAmount) / item.step;
        const candidate: AdjustmentState = {
          energy,
          penalty: state.penalty + steps * (1 + item.priority * 0.15),
          amounts: [...state.amounts, amount]
        };
        const current = next.get(key);
        if (!current || candidate.penalty < current.penalty) {
          next.set(key, candidate);
        }
      }
    }
    states = next;
  });

  let best: AdjustmentState | undefined;
  let bestError = Number.POSITIVE_INFINITY;
  for (const state of states.values()) {
    const error = Math.abs(fixedCalories + state.energy - targetCalories);
    if (
      error < bestError - 0.05 ||
      (Math.abs(error - bestError) <= 0.05 &&
        state.penalty < (best?.penalty ?? Number.POSITIVE_INFINITY))
    ) {
      best = state;
      bestError = error;
    }
  }
  return best?.amounts ?? adjustableItems.map((item) => item.baseAmount);
}

function applyAmounts(
  plan: DerivedPlan,
  adjustableItems: AdjustableItem[],
  amounts: number[],
  targetCalories: number
): DerivedPlan {
  const selectedAmounts = new Map(
    adjustableItems.map((item, index) => [
      `${item.mealIndex}:${item.itemIndex}`,
      amounts[index]
    ])
  );
  const meals: DerivedMeal[] = plan.meals.map((meal, mealIndex) => {
    const items = meal.items.map((item, itemIndex) => {
      const amount = selectedAmounts.get(`${mealIndex}:${itemIndex}`);
      if (amount === undefined || amount === item.amount.value) return item;
      return {
        ...item,
        amount: { ...item.amount, value: amount } satisfies Amount,
        macros: scaleMacros(item, amount)
      };
    });
    return {
      ...meal,
      items,
      totals: sumMacros(items.map((item) => item.macros))
    };
  });
  const totals = sumMacros(meals.map((meal) => meal.totals));
  return {
    ...plan,
    meals,
    totals,
    difference_from_target_kcal: round(
      totals.energy_kcal - targetCalories
    )
  };
}

export function adjustPlanToCalories(
  dayPlanId: DayPlanId,
  variantId: VariantId,
  requestedTarget: number
): DerivedPlan {
  const limits = CALORIE_TARGET_LIMITS[dayPlanId];
  const targetCalories = Math.round(
    Math.min(limits.max, Math.max(limits.min, requestedTarget))
  );
  const plan = nutritionPlan.day_plans[dayPlanId].derived[variantId];
  if (targetCalories === DEFAULT_CALORIE_TARGETS[dayPlanId]) {
    return plan;
  }
  const cacheKey = `${dayPlanId}:${variantId}:${targetCalories}`;
  const cached = adjustedPlanCache.get(cacheKey);
  if (cached) return cached;

  const adjustableItems = getAdjustableItems(dayPlanId, plan);
  const amounts = selectAmounts(plan, adjustableItems, targetCalories);
  const adjusted = applyAmounts(
    plan,
    adjustableItems,
    amounts,
    targetCalories
  );
  adjustedPlanCache.set(cacheKey, adjusted);
  return adjusted;
}
