"use client";

import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Minus,
  Plus,
  ShoppingBasket
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  formatPackSize,
  getShoppingList,
  shoppingListText,
  totalShoppingDays,
  type ShoppingDayCounts
} from "./shopping";

const DEFAULT_COUNTS: ShoppingDayCounts = {
  climbingTofu: 4,
  climbingChicken: 0,
  restTofu: 3,
  restChicken: 0
};

const COUNTERS: Array<{
  key: keyof ShoppingDayCounts;
  title: string;
  description: string;
}> = [
  {
    key: "climbingTofu",
    title: "Climbing · Tofu",
    description: "Default pasta dinner"
  },
  {
    key: "climbingChicken",
    title: "Climbing · Chicken",
    description: "Optional pasta dinner"
  },
  {
    key: "restTofu",
    title: "Rest · Tofu",
    description: "Default pasta dinner"
  },
  {
    key: "restChicken",
    title: "Rest · Chicken",
    description: "Optional pasta dinner"
  }
];

export function ShoppingPlanner() {
  const [counts, setCounts] = useState<ShoppingDayCounts>(DEFAULT_COUNTS);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const items = useMemo(() => getShoppingList(counts), [counts]);
  const days = totalShoppingDays(counts);

  function updateCount(key: keyof ShoppingDayCounts, value: number) {
    const next = Number.isFinite(value)
      ? Math.max(0, Math.min(99, Math.floor(value)))
      : 0;
    setCounts((current) => ({ ...current, [key]: next }));
    setChecked(new Set());
    setStatus("");
  }

  function toggleItem(ingredientId: string) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  }

  async function copyList() {
    try {
      await navigator.clipboard.writeText(shoppingListText(counts, items));
      setStatus("Shopping list copied.");
    } catch {
      setStatus("Copying is unavailable in this browser.");
    }
  }

  function downloadList() {
    const blob = new Blob([shoppingListText(counts, items)], {
      type: "text/plain"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crux-shopping-list-${days}-days.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Shopping list downloaded.");
  }

  return (
    <section className="shopping-planner" aria-labelledby="shopping-heading">
      <div className="shopping-heading">
        <div className="shopping-heading-icon" aria-hidden="true">
          <ShoppingBasket size={22} />
        </div>
        <div>
          <p className="eyebrow">Pack calculator</p>
          <h2 id="shopping-heading">Shopping list</h2>
          <p>Choose your days. Quantities round up to whole shop packs.</p>
        </div>
      </div>

      <div className="day-counter-list">
        {COUNTERS.map((counter) => {
          const value = counts[counter.key];
          return (
            <div className="day-counter" key={counter.key}>
              <div>
                <strong>{counter.title}</strong>
                <span>{counter.description}</span>
              </div>
              <div className="stepper">
                <button
                  type="button"
                  aria-label={`Decrease ${counter.title} days`}
                  disabled={value === 0}
                  onClick={() => updateCount(counter.key, value - 1)}
                >
                  <Minus aria-hidden="true" size={16} />
                </button>
                <label>
                  <span className="sr-only">{counter.title} days</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="99"
                    value={value}
                    aria-label={`${counter.title} days`}
                    onChange={(event) =>
                      updateCount(counter.key, Number(event.target.value))
                    }
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Increase ${counter.title} days`}
                  disabled={value === 99}
                  onClick={() => updateCount(counter.key, value + 1)}
                >
                  <Plus aria-hidden="true" size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shopping-summary">
        <div>
          <strong>{days}</strong>
          <span>{days === 1 ? "day" : "days"}</span>
        </div>
        <div>
          <strong>{items.length}</strong>
          <span>{items.length === 1 ? "product" : "products"}</span>
        </div>
        <div>
          <strong>{checked.size}</strong>
          <span>picked up</span>
        </div>
      </div>

      {items.length ? (
        <>
          <div className="shopping-actions">
            <button className="button" type="button" onClick={copyList}>
              <Copy aria-hidden="true" size={17} />
              Copy
            </button>
            <button className="button" type="button" onClick={downloadList}>
              <Download aria-hidden="true" size={17} />
              Download
            </button>
          </div>
          <div className="shopping-list">
            {items.map((item) => {
              const isChecked = checked.has(item.ingredientId);
              return (
                <article
                  className="shopping-item"
                  data-checked={isChecked || undefined}
                  key={item.ingredientId}
                >
                  <button
                    type="button"
                    className="shopping-check"
                    role="checkbox"
                    aria-checked={isChecked}
                    aria-label={`${isChecked ? "Uncheck" : "Check off"} ${item.name}`}
                    onClick={() => toggleItem(item.ingredientId)}
                  >
                    <Check aria-hidden="true" size={17} strokeWidth={3} />
                  </button>
                  <div className="shopping-item-main">
                    <strong>{item.name}</strong>
                    <span>
                      {item.packSelections
                        .map(
                          (selection) =>
                            `${selection.count} × ${formatPackSize(
                              selection.quantity,
                              selection.unit
                            )}`
                        )
                        .join(" + ")}
                    </span>
                    {item.note && <small>{item.note}</small>}
                  </div>
                  <div className="shopping-quantity">
                    <strong>{item.quantity}</strong>
                    <span>{item.quantityLabel}</span>
                  </div>
                  {item.sourceUrl && (
                    <a
                      className="shopping-link"
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${item.name} on Morrisons`}
                    >
                      <ExternalLink aria-hidden="true" size={15} />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
          <p className="pantry-note">
            Also check your pantry for garlic granules, ginger paste, chilli
            flakes and water or no-added-sugar squash.
          </p>
        </>
      ) : (
        <div className="shopping-empty">
          <ShoppingBasket aria-hidden="true" size={24} />
          <p>Add at least one day to build your list.</p>
        </div>
      )}
      <p className="shopping-status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
