import type { Amount } from "@/types/nutrition";

const UNIT_LABELS: Record<string, string> = {
  medium_banana: "medium banana",
  rice_cake: "rice cakes",
  wrapper: "wrapper"
};

export function formatAmount(amount: Amount): string {
  const unit = UNIT_LABELS[amount.unit] ?? amount.unit;
  const state = amount.state
    ? ` · ${amount.state.replaceAll("_", " ")}`
    : "";
  return `${amount.value}${amount.unit === "g" || amount.unit === "ml" ? "" : " "}${unit}${state}`;
}

export function formatMacro(value: number, unit = "g"): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit}`;
}
