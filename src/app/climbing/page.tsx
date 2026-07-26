import type { Metadata } from "next";
import { ClimbingPage } from "@/features/climbing/climbing-page";

export const metadata: Metadata = {
  title: "Log climbing"
};

export default function Page() {
  return <ClimbingPage />;
}
