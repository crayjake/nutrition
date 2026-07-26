"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import type { DayPlanId, VariantId } from "@/types/nutrition";

export function NutritionControls({
  dayPlanId,
  variantId,
  onDayPlanChange,
  onVariantChange
}: {
  dayPlanId: DayPlanId;
  variantId: VariantId;
  onDayPlanChange: (value: DayPlanId) => void;
  onVariantChange: (value: VariantId) => void;
}) {
  return (
    <div className="control-stack">
      <SegmentedControl
        label="Day plan"
        value={dayPlanId}
        onChange={onDayPlanChange}
        options={[
          { value: "climbing", label: "Climbing day" },
          { value: "rest", label: "Rest day" }
        ]}
      />
      <SegmentedControl
        label="Protein variant"
        value={variantId}
        onChange={onVariantChange}
        options={[
          { value: "default", label: "Tofu", hint: "Default" },
          { value: "chicken_pasta", label: "Chicken", hint: "Optional" }
        ]}
      />
    </div>
  );
}
