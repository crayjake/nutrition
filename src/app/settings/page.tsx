import type { Metadata } from "next";
import { SettingsPage } from "@/features/tracking/settings-page";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <SettingsPage />;
}
