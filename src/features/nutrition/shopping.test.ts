import { describe, expect, it } from "vitest";
import {
  getShoppingList,
  shoppingListText,
  totalShoppingDays,
  type ShoppingDayCounts
} from "./shopping";

const DEFAULT_WEEK: ShoppingDayCounts = {
  climbingTofu: 4,
  climbingChicken: 0,
  restTofu: 3,
  restChicken: 0
};

function findItem(
  counts: ShoppingDayCounts,
  ingredientId: string
) {
  return getShoppingList(counts).find(
    (item) => item.ingredientId === ingredientId
  );
}

describe("shopping-list calculations", () => {
  it("matches the supplied default four-climbing, three-rest pack plan", () => {
    expect(findItem(DEFAULT_WEEK, "fage_total_0_950g")?.quantity).toBe(4);
    expect(findItem(DEFAULT_WEEK, "tofoo_naked_tofu_280g")?.quantity).toBe(10);
    expect(findItem(DEFAULT_WEEK, "fyffes_medium_banana")?.quantity).toBe(2);
    expect(
      findItem(DEFAULT_WEEK, "morrisons_lightly_salted_rice_cake")?.quantity
    ).toBe(2);
    expect(findItem(DEFAULT_WEEK, "morrisons_penne_500g")?.quantity).toBe(1);
  });

  it("uses the supplied chicken raw-weight conversion and pack options", () => {
    const counts: ShoppingDayCounts = {
      climbingTofu: 0,
      climbingChicken: 4,
      restTofu: 0,
      restChicken: 3
    };
    const chicken = findItem(counts, "morrisons_chicken_breast");
    expect(chicken?.quantity).toBe(2);
    expect(chicken?.packSelections).toEqual([
      { count: 1, quantity: 630, unit: "g" },
      { count: 1, quantity: 1000, unit: "g" }
    ]);
    expect(findItem(counts, "tofoo_naked_tofu_280g")?.quantity).toBe(5);
  });

  it("chooses the smallest suitable chicken pack combination", () => {
    const counts: ShoppingDayCounts = {
      climbingTofu: 0,
      climbingChicken: 5,
      restTofu: 0,
      restChicken: 0
    };
    expect(
      findItem(counts, "morrisons_chicken_breast")?.packSelections
    ).toEqual([{ count: 1, quantity: 1000, unit: "g" }]);
  });

  it("returns no products for no selected days", () => {
    const empty: ShoppingDayCounts = {
      climbingTofu: 0,
      climbingChicken: 0,
      restTofu: 0,
      restChicken: 0
    };
    expect(getShoppingList(empty)).toEqual([]);
    expect(totalShoppingDays(empty)).toBe(0);
  });

  it("exports shelf quantities rather than aggregate food weights", () => {
    const text = shoppingListText(DEFAULT_WEEK, getShoppingList(DEFAULT_WEEK));
    expect(text).toContain("4 tubs — FAGE");
    expect(text).toContain("(4 × 950 g)");
    expect(text).not.toContain("3500");
  });
});
