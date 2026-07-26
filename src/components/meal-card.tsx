"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getIngredientName } from "@/features/nutrition/selectors";
import { formatAmount, formatMacro } from "@/lib/format";
import type { DerivedMeal } from "@/types/nutrition";

export function MealCard({
  meal,
  time,
  completed,
  onToggle,
  readOnly = false
}: {
  meal: DerivedMeal;
  time?: string;
  completed?: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `meal-${meal.meal_instance_id}-${meal.template_id}`;
  const toggleExpanded = () => setExpanded((value) => !value);

  return (
    <article className="meal-card" data-completed={completed || undefined}>
      <div className="meal-card-top" onClick={toggleExpanded}>
        {!readOnly && (
          <button
            className="check-button"
            data-checked={Boolean(completed)}
            onClick={(event) => {
              event.stopPropagation();
              onToggle?.();
            }}
            type="button"
            role="checkbox"
            aria-checked={Boolean(completed)}
            aria-label={`${completed ? "Mark incomplete" : "Mark complete"}: ${meal.name}`}
          >
            <Check aria-hidden="true" size={19} strokeWidth={3} />
          </button>
        )}
        <div className="meal-heading">
          <h3>{meal.name}</h3>
          <p>
            {time && (
              <>
                <time dateTime={time}>{time}</time>
                <span aria-hidden="true"> · </span>
              </>
            )}
            {Math.round(meal.totals.energy_kcal)} kcal
            <span aria-hidden="true"> · </span>
            {formatMacro(meal.totals.protein_g)} protein
          </p>
        </div>
        <button
          type="button"
          className="expand-button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={`${expanded ? "Hide" : "Show"} ingredients for ${meal.name}`}
          onClick={(event) => {
            event.stopPropagation();
            toggleExpanded();
          }}
        >
          <ChevronDown aria-hidden="true" size={20} />
        </button>
      </div>
      {expanded && (
        <div className="meal-details" id={detailsId}>
          <div className="ingredient-list">
            {meal.items.map((item) => (
              <div className="ingredient-row" key={item.component_id}>
                <div className="ingredient-main">
                  <span>{getIngredientName(item)}</span>
                  <small>{formatAmount(item.amount)}</small>
                </div>
                <dl className="ingredient-macros">
                  <div>
                    <dt>kcal</dt>
                    <dd>{Math.round(item.macros.energy_kcal)}</dd>
                  </div>
                  <div>
                    <dt>P</dt>
                    <dd>{formatMacro(item.macros.protein_g)}</dd>
                  </div>
                  <div>
                    <dt>C</dt>
                    <dd>{formatMacro(item.macros.carbohydrate_g)}</dd>
                  </div>
                  <div>
                    <dt>F</dt>
                    <dd>{formatMacro(item.macros.fat_g)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          <div className="meal-total-row">
            <strong>Meal total</strong>
            <span>
              {Math.round(meal.totals.energy_kcal)} kcal ·{" "}
              {formatMacro(meal.totals.protein_g)} protein
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
