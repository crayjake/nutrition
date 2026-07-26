import { describe, expect, it } from "vitest";
import { CALORIE_TARGET_LIMITS } from "./calorie-targets";
import {
  completionPercentage,
  getConsumedMacros,
  getDailyTotals,
  getIngredientName,
  getMeal,
  getMeals,
  resolveDayPlan
} from "./selectors";

describe("nutrition selectors", () => {
  it("resolves the supplied climbing default", () => {
    const plan = resolveDayPlan("climbing", "default");
    expect(plan.variant).toBe("default");
    expect(plan.meals).toHaveLength(6);
    expect(plan.totals.energy_kcal).toBeCloseTo(2197.55);
  });

  it("keeps tofu as default and resolves chicken as an option", () => {
    const tofu = getMeal("rest", "default", "dinner");
    const chicken = getMeal("rest", "chicken_pasta", "dinner");
    expect(tofu?.items.find((item) => item.component_id === "protein")?.ingredient_id)
      .toBe("tofoo_naked_tofu_280g");
    expect(chicken?.items.find((item) => item.component_id === "protein")?.ingredient_id)
      .toBe("morrisons_chicken_breast");
    expect(chicken?.items.find((item) => item.component_id === "penne")?.amount.value)
      .toBe(69);
    expect(tofu?.name).toBe("Tofu pesto pasta");
    expect(chicken?.name).toBe("Chicken pesto pasta");
  });

  it("returns meals, product names and cached daily macros", () => {
    const meals = getMeals("rest", "default");
    expect(meals).toHaveLength(5);
    expect(getIngredientName(meals[0].items[0])).toMatch(/FAGE/i);
    expect(getDailyTotals("rest", "default").protein_g).toBeCloseTo(141.9, 1);
  });

  it("keeps every ingredient in the adjusted plans above zero", () => {
    for (const dayPlanId of ["climbing", "rest"] as const) {
      for (const variantId of ["default", "chicken_pasta"] as const) {
        for (const meal of getMeals(dayPlanId, variantId)) {
          for (const item of meal.items) {
            expect(item.amount.value).toBeGreaterThan(0);
          }
        }
      }
    }
    const evening = getMeal("climbing", "default", "evening");
    expect(
      evening?.items.find((item) => item.component_id === "honey")?.amount.value
    ).toBe(5);
  });

  it("adjusts practical portions to a custom calorie target", () => {
    const higher = resolveDayPlan("climbing", "default", 2400);
    const lower = resolveDayPlan("climbing", "default", 1900);

    expect(Math.abs(higher.totals.energy_kcal - 2400)).toBeLessThan(5);
    expect(Math.abs(lower.totals.energy_kcal - 1900)).toBeLessThan(5);
    expect(
      higher.meals
        .flatMap((meal) => meal.items)
        .every((item) => item.amount.value > 0)
    ).toBe(true);
    expect(
      lower.meals
        .flatMap((meal) => meal.items)
        .every((item) => item.amount.value > 0)
    ).toBe(true);
    expect(
      higher.meals[0].items.find((item) => item.component_id === "yoghurt")
        ?.amount.value
    ).toBe(300);
    expect(higher.totals.energy_kcal).toBeGreaterThan(
      resolveDayPlan("climbing", "default").totals.energy_kcal
    );
  });

  it("keeps both variants achievable across the supported target ranges", () => {
    for (const dayPlanId of ["climbing", "rest"] as const) {
      for (const variantId of ["default", "chicken_pasta"] as const) {
        for (const target of Object.values(CALORIE_TARGET_LIMITS[dayPlanId])) {
          const adjusted = resolveDayPlan(dayPlanId, variantId, target);
          expect(
            Math.abs(adjusted.totals.energy_kcal - target)
          ).toBeLessThan(10);
          expect(
            adjusted.meals
              .flatMap((meal) => meal.items)
              .every((item) => item.amount.value > 0)
          ).toBe(true);
        }
      }
    }
    expect(resolveDayPlan("climbing", "default", 2200)).toBe(
      resolveDayPlan("climbing", "default")
    );
  });

  it("calculates bounded completion percentages", () => {
    expect(completionPercentage(3, 6)).toBe(50);
    expect(completionPercentage(8, 6)).toBe(100);
    expect(completionPercentage(0, 0)).toBe(0);
  });

  it("sums only completed meal macros", () => {
    const meals = getMeals("climbing", "default");
    const consumed = getConsumedMacros(meals, ["breakfast", "evening"]);
    expect(consumed.energy_kcal).toBeCloseTo(623.9);
    expect(consumed.protein_g).toBeCloseTo(60.48);
    expect(consumed.carbohydrate_g).toBeCloseTo(76.48);
  });
});
