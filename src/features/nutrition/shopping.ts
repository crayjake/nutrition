import { nutritionPlan } from "@/data/nutrition";
import { getMeals } from "./selectors";
import type { DayPlanId, Product, VariantId } from "@/types/nutrition";

export interface ShoppingDayCounts {
  climbingTofu: number;
  climbingChicken: number;
  restTofu: number;
  restChicken: number;
}

export interface PackSelection {
  count: number;
  quantity: number;
  unit: string;
}

export interface ShoppingItem {
  ingredientId: string;
  name: string;
  quantity: number;
  quantityLabel: string;
  packSelections: PackSelection[];
  sourceUrl?: string;
  note?: string;
}

interface RequiredIngredient {
  value: number;
  unit: string;
}

const PACK_NOUNS: Record<string, [string, string]> = {
  fage_total_0_950g: ["tub", "tubs"],
  fuel10k_chocolate_granola_400g: ["bag", "bags"],
  m_organic_clear_honey_340g: ["bottle", "bottles"],
  fyffes_medium_banana: ["pack", "packs"],
  yutaka_sushi_rice_500g: ["bag", "bags"],
  tofoo_naked_tofu_280g: ["pack", "packs"],
  morrisons_country_mix_1kg: ["bag", "bags"],
  kikkoman_less_salt_soy_150ml: ["bottle", "bottles"],
  morrisons_sunflower_oil_1l: ["bottle", "bottles"],
  morrisons_lightly_salted_rice_cake: ["pack", "packs"],
  nature_valley_oats_honey_wrapper: ["box", "boxes"],
  morrisons_penne_500g: ["bag", "bags"],
  morrisons_green_pesto_190g: ["jar", "jars"],
  morrisons_whole_leaf_spinach_950g: ["bag", "bags"],
  morrisons_chicken_breast: ["pack", "packs"]
};

const DAY_COMBINATIONS: Array<{
  key: keyof ShoppingDayCounts;
  dayPlanId: DayPlanId;
  variantId: VariantId;
}> = [
  { key: "climbingTofu", dayPlanId: "climbing", variantId: "default" },
  {
    key: "climbingChicken",
    dayPlanId: "climbing",
    variantId: "chicken_pasta"
  },
  { key: "restTofu", dayPlanId: "rest", variantId: "default" },
  {
    key: "restChicken",
    dayPlanId: "rest",
    variantId: "chicken_pasta"
  }
];

function normaliseCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(99, Math.floor(value)));
}

function addRequirements(counts: ShoppingDayCounts) {
  const required = new Map<string, RequiredIngredient>();

  for (const combination of DAY_COMBINATIONS) {
    const days = normaliseCount(counts[combination.key]);
    if (!days) continue;
    for (const meal of getMeals(
      combination.dayPlanId,
      combination.variantId
    )) {
      for (const item of meal.items) {
        if (item.amount.value <= 0) continue;
        const existing = required.get(item.ingredient_id);
        const value = item.amount.value * days;
        if (existing) existing.value += value;
        else {
          required.set(item.ingredient_id, {
            value,
            unit: item.amount.unit
          });
        }
      }
    }
  }
  return required;
}

function optimisePackOptions(
  required: number,
  options: NonNullable<Product["pack_options"]>
): PackSelection[] {
  if (!options.length) return [];
  let best:
    | { counts: number[]; supplied: number; numberOfPacks: number }
    | undefined;
  const smallest = Math.min(...options.map((option) => option.quantity));
  const maxPacks = Math.ceil(required / smallest) + 1;

  function search(index: number, counts: number[]) {
    if (index === options.length) {
      const supplied = counts.reduce(
        (sum, count, optionIndex) =>
          sum + count * options[optionIndex].quantity,
        0
      );
      if (supplied < required) return;
      const numberOfPacks = counts.reduce((sum, count) => sum + count, 0);
      if (
        !best ||
        supplied < best.supplied ||
        (supplied === best.supplied && numberOfPacks < best.numberOfPacks)
      ) {
        best = { counts: [...counts], supplied, numberOfPacks };
      }
      return;
    }
    for (let count = 0; count <= maxPacks; count += 1) {
      counts[index] = count;
      search(index + 1, counts);
    }
  }

  search(0, []);
  if (!best) return [];
  return best.counts.flatMap((count, index) =>
    count
      ? [
          {
            count,
            quantity: options[index].quantity,
            unit: options[index].unit
          }
        ]
      : []
  );
}

function resolvePacks(
  ingredientId: string,
  required: RequiredIngredient,
  product: Product
): { selections: PackSelection[]; note?: string } {
  if (product.pack_options?.length) {
    const adjustedRequired =
      ingredientId === "morrisons_chicken_breast"
        ? required.value * (4 / 3)
        : required.value;
    return {
      selections: optimisePackOptions(adjustedRequired, product.pack_options),
      ...(ingredientId === "morrisons_chicken_breast"
        ? { note: "Pack count uses the supplied cooked-to-raw chicken estimate." }
        : {})
    };
  }

  if (!product.pack) return { selections: [] };
  const pack = product.pack;
  let count: number;
  if (required.unit === pack.unit) {
    count = Math.ceil(required.value / pack.quantity);
  } else if (required.unit === "medium_banana" && pack.unit === "item") {
    count = Math.ceil(required.value / pack.quantity);
  } else if (required.unit === "rice_cake" && pack.approx_items) {
    count = Math.ceil(required.value / pack.approx_items);
  } else {
    count = Math.ceil(required.value);
  }
  return {
    selections: [{ count, quantity: pack.quantity, unit: pack.unit }]
  };
}

export function getShoppingList(
  counts: ShoppingDayCounts
): ShoppingItem[] {
  return [...addRequirements(counts)].flatMap(
    ([ingredientId, requirement]) => {
      const product = nutritionPlan.products[ingredientId];
      if (!product) return [];
      const { selections, note } = resolvePacks(
        ingredientId,
        requirement,
        product
      );
      const quantity = selections.reduce(
        (sum, selection) => sum + selection.count,
        0
      );
      if (!quantity) return [];
      const nouns = PACK_NOUNS[ingredientId] ?? ["pack", "packs"];
      return [
        {
          ingredientId,
          name: product.name,
          quantity,
          quantityLabel: quantity === 1 ? nouns[0] : nouns[1],
          packSelections: selections,
          ...(product.source?.url ? { sourceUrl: product.source.url } : {}),
          ...(note ? { note } : {})
        }
      ];
    }
  );
}

export function totalShoppingDays(counts: ShoppingDayCounts): number {
  return Object.values(counts).reduce(
    (sum, value) => sum + normaliseCount(value),
    0
  );
}

export function formatPackSize(quantity: number, unit: string): string {
  if (unit === "g" && quantity >= 1000 && quantity % 1000 === 0) {
    return `${quantity / 1000} kg`;
  }
  if (unit === "ml" && quantity >= 1000 && quantity % 1000 === 0) {
    return `${quantity / 1000} L`;
  }
  return `${quantity} ${unit}`;
}

export function shoppingListText(
  counts: ShoppingDayCounts,
  items: ShoppingItem[]
): string {
  const days = totalShoppingDays(counts);
  return [
    `Crux shopping list · ${days} ${days === 1 ? "day" : "days"}`,
    "",
    ...items.map((item) => {
      const packs = item.packSelections
        .map(
          (selection) =>
            `${selection.count} × ${formatPackSize(selection.quantity, selection.unit)}`
        )
        .join(" + ");
      return `☐ ${item.quantity} ${item.quantityLabel} — ${item.name} (${packs})`;
    })
  ].join("\n");
}
