# Nutrition plan data model

This package contains:

- `nutrition-plan.json`: canonical product catalogue, reusable meal templates, day-plan overrides, optional chicken variants, derived item/meal/day macros, and a weekly shopping list.
- `nutrition-plan.schema.json`: a JSON Schema for basic structural validation.

## Calculated default days

| Day | Target | Calculated | Protein | Carbohydrate | Fat |
|---|---:|---:|---:|---:|---:|
| Climbing | 2,200 kcal | 2199.6 kcal | 155.9 g | 245.9 g | 57.0 g |
| Rest | 1,900 kcal | 1900.8 kcal | 141.9 g | 213.3 g | 45.6 g |

## Why the structure is split

`products` is the single source of truth for label nutrition. `meal_templates` reference product IDs and define component roles, alternatives, and scaling bounds. `day_plans` reference templates and contain only day-specific overrides. `derived` is a cache for a static/mobile UI, so the site can render immediately without recalculating.

For target changes, adjust components whose `scaling.mode` is `adjustable`, respecting `min`, `max`, and `step`. The supplied priority order changes rice and pasta before smaller sauce/oil/honey adjustments, while keeping protein, fruit, vegetables, and climbing fuel fixed.

## Chicken caveat

Morrisons labels the chicken nutrition “as consumed”, so chicken amounts in the plan are cooked weights. The shopping estimate uses **150g cooked ≈ 200g raw** and marks this as an estimate.

## Data provenance

Nutrition data was checked against Morrisons UK product pages on 2026-07-26. Product labels can change, so packaging remains the final authority.
