import type { Macros } from "@/types/nutrition";

interface RingDefinition {
  key: "energy_kcal" | "protein_g" | "carbohydrate_g" | "fat_g";
  label: string;
  unit: string;
  spokenUnit: string;
}

const RINGS: RingDefinition[] = [
  {
    key: "energy_kcal",
    label: "Energy",
    unit: "kcal",
    spokenUnit: "kilocalories"
  },
  { key: "protein_g", label: "Protein", unit: "g", spokenUnit: "grams" },
  {
    key: "carbohydrate_g",
    label: "Carbs",
    unit: "g",
    spokenUnit: "grams"
  },
  { key: "fat_g", label: "Fat", unit: "g", spokenUnit: "grams" }
];

export function MacroRings({
  consumed,
  goals
}: {
  consumed: Macros;
  goals: Macros;
}) {
  return (
    <dl className="macro-rings">
      {RINGS.map(({ key, label, unit, spokenUnit }) => {
        const current = Math.round(consumed[key]);
        const goal = Math.round(goals[key]);
        const percentage =
          goal > 0 ? Math.max(0, Math.min(100, (current / goal) * 100)) : 0;
        return (
          <div className="macro-ring-item" data-macro={key} key={key}>
            <dt>{label}</dt>
            <dd>
              <div
                className="macro-ring"
                role="progressbar"
                aria-label={`${label} eaten: ${current} of ${goal} ${spokenUnit}`}
                aria-valuemin={0}
                aria-valuemax={goal}
                aria-valuenow={current}
              >
                <svg viewBox="0 0 44 44" aria-hidden="true">
                  <circle className="macro-ring-track" cx="22" cy="22" r="18" />
                  <circle
                    className="macro-ring-value"
                    cx="22"
                    cy="22"
                    r="18"
                    pathLength="100"
                    strokeDasharray="100"
                    strokeDashoffset={100 - percentage}
                  />
                </svg>
                <span className="macro-ring-number">
                  <strong>{current.toLocaleString("en-GB")}</strong>
                  <small>
                    of {goal.toLocaleString("en-GB")}
                  </small>
                </span>
              </div>
              <span className="macro-ring-unit">{unit}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
