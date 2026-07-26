export type DayPlanId = "climbing" | "rest";
export type VariantId = "default" | "chicken_pasta";

export interface CalorieTargets {
  climbing: number;
  rest: number;
}

export interface Macros {
  energy_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  fibre_g: number;
  sugars_g: number;
  salt_g: number;
}

export interface Amount {
  value: number;
  unit: string;
  state?: string;
}

export interface DerivedMealItem {
  component_id: string;
  ingredient_id: string;
  amount: Amount;
  macros: Macros;
}

export interface DerivedMeal {
  meal_instance_id: string;
  template_id: string;
  name: string;
  items: DerivedMealItem[];
  totals: Macros;
}

export interface DerivedPlan {
  variant: string;
  meals: DerivedMeal[];
  totals: Macros;
  difference_from_target_kcal: number;
}

export interface Product {
  name: string;
  brand?: string;
  retailer: string;
  pack?: {
    quantity: number;
    unit: string;
    approx_items?: number;
    wrapper_weight_g?: number;
    bars_per_wrapper?: number;
  } | null;
  pack_options?: Array<{
    quantity: number;
    unit: string;
    url?: string;
  }> | null;
  source?: {
    url: string;
    checked_on?: string;
  } | null;
}

export interface MealTemplate {
  components: Array<{
    id: string;
    scaling: {
      mode: string;
      min?: number;
      max?: number;
      step?: number;
      weight?: number;
    };
  }>;
}

export interface NutritionPlan {
  meta: {
    schema_version: string;
    title: string;
    nutrition_data_checked_on: string;
  };
  products: Record<string, Product>;
  meal_templates: Record<string, MealTemplate>;
  day_plans: Record<
    DayPlanId,
    {
      name: string;
      target_adjustment: {
        adjustable_order: string[];
      };
      derived: Record<VariantId, DerivedPlan>;
    }
  >;
}
