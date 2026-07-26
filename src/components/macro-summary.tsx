import type { Macros } from "@/types/nutrition";

export function MacroSummary({ totals }: { totals: Macros }) {
  return (
    <dl className="macro-grid">
      <div className="macro-primary">
        <dt>Energy</dt>
        <dd>{Math.round(totals.energy_kcal).toLocaleString("en-GB")}</dd>
        <span>kcal</span>
      </div>
      <div>
        <dt>Protein</dt>
        <dd>{Math.round(totals.protein_g)}g</dd>
      </div>
      <div>
        <dt>Carbs</dt>
        <dd>{Math.round(totals.carbohydrate_g)}g</dd>
      </div>
      <div>
        <dt>Fat</dt>
        <dd>{Math.round(totals.fat_g)}g</dd>
      </div>
    </dl>
  );
}
