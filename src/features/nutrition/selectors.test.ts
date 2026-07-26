import { describe, expect, it } from "vitest";
import {
  completionPercentage,
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
    expect(plan.totals.energy_kcal).toBeCloseTo(2199.6);
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
  });

  it("returns meals, product names and cached daily macros", () => {
    const meals = getMeals("rest", "default");
    expect(meals).toHaveLength(5);
    expect(getIngredientName(meals[0].items[0])).toMatch(/FAGE/i);
    expect(getDailyTotals("rest", "default").protein_g).toBeCloseTo(141.9, 1);
  });

  it("calculates bounded completion percentages", () => {
    expect(completionPercentage(3, 6)).toBe(50);
    expect(completionPercentage(8, 6)).toBe(100);
    expect(completionPercentage(0, 0)).toBe(0);
  });
});
