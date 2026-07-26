import type { Metadata } from "next";
import { PlanPage } from "@/features/nutrition/plan-page";

export const metadata: Metadata = { title: "Nutrition plan" };

export default function Page() {
  return <PlanPage />;
}
