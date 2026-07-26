import type { Metadata } from "next";
import { ShoppingPlanner } from "@/features/nutrition/shopping-planner";

export const metadata: Metadata = { title: "Shopping list" };

export default function Page() {
  return <ShoppingPlanner />;
}
